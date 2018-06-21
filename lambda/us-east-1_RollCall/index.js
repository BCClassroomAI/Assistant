// This is the roll call  app for Alexa

'use strict';
const Alexa = require("alexa-sdk");
const AWS = require("aws-sdk");
//const config = require("./user-config.json");
//const s3 = new AWS.S3();
const sheetsy = require("sheetsy");
const { urlToKey, getWorkbook, getSheet } = sheetsy;

const key = '12B19KY3fNkgR4M_D56XQHNqCazr_oPoASI--0scdnZQ';

// function init() {
//     Tabletop.init( { key: publicSpreadsheetUrl,
//                      callback: showInfo,
//                      simpleSheet: true } )
// }

// function showInfo(data, tabletop) {
//     console.log('Successfully processed!');
//     console.log("DATA: " + data);
//     //console.log("Element: " + data["1111"]["elements"][0]["Tag"]);
//     //console.log("Passed Attributes: " + tabletop.passedAttributes);
//     //console.log("***** TableTop Property: " + tabletop.wrf);
// }

const initializeCourses = (attributes) => {
    console.log("We're in initializeCourses");
    if (!attributes.hasOwnProperty('courses')) console.log('making a courses attribute');
        attributes.courses = {
    "1111": [
        {name: "Tom", beenCalled: 0},
        {name: "Jerry", beenCalled: 0},
        {name: "Joe", beenCalled: 0}
        ],
    "2222": [
        {name: "Jack", beenCalled: 0},
        {name: "Daewoo", beenCalled: 0}
        ]
        }
};

// const initializeQuestions = (attributes) => {
//     console.log('Initializing Questions');
//
//     let ids = [];
//
//     getWorkbook(key).then(workbook => {
//         ids = workbook["sheets"];
//     };
//
//     return ids;
//
//     // let tabletop = Tabletop.init({
//     //     key: publicSpreadsheetUrl,
//     //     callback: showInfo
//     // });
//
//     //console.log("Tabletop Sheets: " + tabletop.sheets());
//     //console.log("Sheet 1111: " + tabletop.sheets("1111"));
//
//     // if (!attributes.hasOwnProperty('allQuestions')) {
//     //     console.log('making an allQuestions attribute');
//     //     getQuestions(attributes);
//     // }
// };

AWS.config.update({region: 'us-east-1'});

exports.handler = function (event, context, callback) {
    const alexa = Alexa.handler(event, context, callback);
    //const s3bkt = event.Records[0].s3.bucket.bcalexaquizquestions;
    //const s3key = event.Records[0].s3.object.quizquestions/SampleQuizQuestions.txt;
    // alexa.dynamoDBTableName = 'RollCallAttributes';
    // alexa.appId = config.appID;
    // const params = {
    //     Bucket: 'bcalexaquizquestions',
    //     Key: '1111.txt'
    // };
    alexa.dynamoDBTableName = "RollCall";
    alexa.registerHandlers(handlers);
    alexa.execute();

};

// async function S3read(params, callback) {
//
//
//     let p = s3.getObject(params).promise();
//     let res = await p;
//     console.log(res.toString());
//
//     const lines = res.Body.toString().split('\r\n');
//     const response = [];
//
//     for (let i=0; i < lines.length; i++) {
//             const qparts = lines[i].split(':');
//             response.push({
//                 tag: qparts[0],
//                 question: qparts[1],
//                 answer: qparts[2],
//                 beenCalled: 0
//             });
//     }
//
//     callback(null,response);
// }

function search(list, target) {
    if (list.length == 0) return false;
    if (list[0] == target) return true;
    return search(list.splice(1), target);
}

function indexOf(students, name) {
    for (let i=0; i<students.length; i++) {
        if (students[i].name === name) return i;
    }
    return NaN;
}

function getNames(students) {
    let names = [];
    students.forEach(student => names.push(student.name));
    return names;
}

// function S3write(params, callback) {
//     // call AWS S3
//     const AWS = require('aws-sdk');
//     const s3 = new AWS.S3();
//
//     s3.putObject(params, function(err, data) {
//         if(err) { console.log(err, err.stack); }
//         else {
//             callback(data["ETag"]);
//
//         }
//     });
// }

function randomQuizQuestion(questionList) {
    let randomIndex = Math.floor(Math.random() * questionList.length);
    let randomQuestion = questionList[randomIndex];
    const beenCalledList = [];
    questionList.forEach(question => beenCalledList.push(question.beenCalled));
    const minim = Math.min(...beenCalledList);
    if (randomQuestion.beenCalled !== minim) {
        return randomQuizQuestion(questionList);
    } else {
        return randomQuestion;
    }
}

function initializesessionID(attributes) {
    if (!attributes.sessionID) {
        attributes.sessionID = 0;
    }
}

function idDoesMatch(oldID, newID) {
    if (oldID == undefined) {
        return true;
    }
    return oldID == newID;
}

const handlers = {
    'LaunchRequest': function () {
        const speechOutput = 'This is the Roll Call skill.';
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },

    //Required Intents
    'AMAZON.HelpIntent': function () {
        const speechOutput = 'This is the Roll Call skill.';
        this.emit(':tell', speechOutput);
    },

    'AMAZON.CancelIntent': function () {
        const speechOutput = 'Goodbye!';
        this.attributes.oldID = this.attributes.sessionID;
        this.emit(':tell', speechOutput);
    },

    'AMAZON.StopIntent': function () {
        const speechOutput = 'See you later!';
        this.attributes.oldID = this.attributes.sessionID;
        this.emit(':tell', speechOutput);
    },

    'Unhandled': function () {
        let speechOutput = 'I did not understand that command.';
        this.response.speak(speechOutput).listen(speechOutput);
        this.emit(':responseReady');
    },

    'SessionEndedRequest' : function () {
        console.log('***session ended***');
        this.attributes.oldID = this.attributes.sessionID;
        this.emit(':saveState', true);
    },

    //Custom Intents
    'GroupPresent': function () {

        initializeCourses(this.attributes);
        // presentList used throughout so declare here so in scope for
        // both findStudent and main code
        let presentList = [];

        // Searches existing presentation list for the student's name, returns true if name is not in list
        function findStudent(student) {
            for (let i = 0; i < presentList.length; i++) {
                if (presentList[i] === student) {
                    return false;
                }
            }
            return true;
        }

        let currentDialogState = this.event.request.dialogState;
        if (currentDialogState !== 'COMPLETED') {

            this.emit(':delegate');

        } else if (!this.attributes.courses.hasOwnProperty(this.event.request.intent.slots.courseNumber.value)) {

            const slotToElicit = 'courseNumber';
            const speechOutput = 'Please provide a valid course number.';
            this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);

        } else {

            const courseNumber = this.event.request.intent.slots.courseNumber.value;
            const groupNumber = parseInt(this.event.request.intent.slots.groupNumber.value);
            presentList = []; // reset presentList

            // Adds students in random order to presentation list if student is not already in list
            let j = 0;
            while (j < this.attributes.courses[courseNumber].length) {
                let randomIndex = Math.floor(Math.random() * this.attributes.courses[courseNumber].length);
                let randomStudent = this.attributes.courses[courseNumber][randomIndex];

                if (findStudent(randomStudent.name)) {
                    presentList.push(randomStudent.name);
                    j++;
                }
            }

            // Names all students randomly ordered, along with number for purpose of presentation order
            // Divides student names into groups based on groupNumber
            let k = 1;
            let speechOutput = '';
            if (groupNumber === 1) {
                for (let l = 0; l < presentList.length; l++) {
                    speechOutput += `${k}, ${presentList[l]}; `;
                    k++;
                }
            } else {
                let groups;
                let eachGroup = [];
                const groupList = [];

                if (this.attributes.courses[courseNumber].length % groupNumber === 0) {
                    groups = this.attributes.courses[courseNumber].length / groupNumber;
                } else {
                    groups = Math.floor(this.attributes.courses[courseNumber].length / groupNumber) + 1;
                }

                for (let l = 0; l < groups; l++) {
                    for (let m = 0; m < groupNumber; m++) {
                        if (presentList.length === 0) {
                            break;
                        }
                        eachGroup.push(presentList[0]);
                        presentList.shift();
                    }
                    groupList.push(eachGroup);
                    eachGroup = [];
                }

                for (let n = 0; n < groupList.length; n++) {
                    speechOutput += `group ${k}, ${groupList[n].toString()}; `;
                    k++;
                }
            }

            this.response.speak(speechOutput);
            this.emit(':responseReady');
        }
    },

    'ColdCall': function () {

        initializeCourses(this.attributes);

        if (this.event.request.dialogState !== "COMPLETED") {

            this.emit(':delegate');

        } else if (!this.attributes.courses.hasOwnProperty(this.event.request.intent.slots.courseNumber.value)) {

            let slotToElicit = 'courseNumber';
            let speechOutput = "I'm sorry, I don't have that course number on record. For which course would you like me to cold call from?";
            this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);

        } else {

            const courseNumber = this.event.request.intent.slots.courseNumber.value;
            this.attributes.courseNumber = courseNumber;
            const beenCalledList = [];
            this.attributes.courses[courseNumber].forEach(student => beenCalledList.push(student.beenCalled));
            const minim = Math.min(...beenCalledList);
            let loop = true;
            while (loop) {
                let randomIndex = Math.floor(Math.random() * this.attributes.courses[courseNumber].length);
                let randomStudent = this.attributes.courses[courseNumber][randomIndex];
                if (randomStudent.beenCalled === minim) {
                    const speechOutput = randomStudent.name;
                    randomStudent.beenCalled++;
                    this.attributes.courses[courseNumber].forEach(student => console.log(`name: ${student.name}, beenCalled: ${student.beenCalled}`));
                    loop = false;
                    this.response.speak(speechOutput);
                    this.emit(':responseReady');
                }
            }
        }
    },

    'QuizQuestion': function () {

        function hasID(courseNumber, ids) {
            for (let i=0; i<ids.length; i++) {
                if (ids[i]["name"] == courseNumber) {
                    return true;
                }
            }
            return false;
        }

        function getID(courseNumber, ids) {
            for (let i=0; i<ids.length; i++) {
                if (ids[i]["name"] == courseNumber) {
                    return ids[i]["id"];
                }
            }
            return null;
        }

        console.log("**** Quiz Question Intent Started");

        initializesessionID(this.attributes);
        let ids = [];
        getWorkbook(key).then(workbook => {
           ids = workbook["sheets"];

           console.log("allQuestions at 345: " + this.attributes.allQuestions);

            let slotObj = this.event.request.intent.slots;

            let currentDialogState = this.event.request.dialogState;
            console.log("**** Dialog State: " + currentDialogState);

            if (idDoesMatch(this.attributes.oldID, this.attributes.sessionID)) {

                if (currentDialogState !== 'COMPLETED') {

                    this.emit(':delegate');

                } else if (!hasID(slotObj.questionSet.value, ids)) {

                    console.log("**** Getting a valid question set");
                    const slotToElicit = 'questionSet';
                    const speechOutput = 'Please provide a valid questionSet.';
                    this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);

                } else {
                    this.attributes.questionSet = slotObj.questionSet.value;
                    this.attributes.oldID = this.attributes.sessionID;
                    this.attributes.sessionID++;

                    this.attributes.allQuestions = [];

                    getSheet(key, getID(this.attributes.questionSet, ids)).then(sheet => {
                        sheet.rows.forEach(row => {
                            this.attributes.allQuestions.push({
                                tag: row[0],
                                question: row[1],
                                answer: row[2],
                                beenCalled: 0
                            })
                        });

                        this.attributes.question = randomQuizQuestion(this.attributes.allQuestions);
                        console.log("**** Question: " + this.attributes.question.question);
                        this.response.speak(this.attributes.question.question).listen(this.attributes.question.question);
                        this.attributes.question.beenCalled++;
                        this.emit(":responseReady");
                    });
                }

            } else {

                this.attributes.question = randomQuizQuestion(this.attributes.allQuestions);
                console.log("**** Question: " + this.attributes.question.question);
                this.response.speak(this.attributes.question.question).listen(this.attributes.question.question);
                this.attributes.question.beenCalled++;
                this.emit(":responseReady");
            }
        });
    },

    'AnswerIntent': function () {

        const correctAnswer = this.attributes.question.answer;

        if (!this.event.request.intent.slots.testAnswers.value) {

            let slotToElicit = 'testAnswers';
            let speechOutput = this.attributes.question.question;
            this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);

        } else {

            const userAnswer = this.event.request.intent.slots.testAnswers.value;
            let speechOutput;

            if (userAnswer == correctAnswer) {
                speechOutput = `Nice job! The correct answer is ${correctAnswer}.`;
            } else {
                speechOutput = `Sorry, the correct answer is ${correctAnswer}`;
            }
            speechOutput += '<break strength = "medium"/>' + ' Would you like another question?';
            this.response.speak(speechOutput).listen('Would you like another question?');
            this.emit(':responseReady');

        }
    },

    'AnotherQuestion' : function () {
        this.emitWithState('QuizQuestion');
    },

    'BonusPoints': function () {
        initializeCourses(this.attributes);
        let currentDialogState = this.event.request.dialogState;
        console.log("**** Dialog State: " + currentDialogState);
        const slotsObj = this.event.request.intent.slots;

        if (currentDialogState !== 'COMPLETED') {
            this.emit(':delegate');

        } else if (!this.attributes.courses.hasOwnProperty(slotsObj.CourseNumber.value)) {
            let slotToElicit = 'CourseNumber';
            let SpeechOutput = 'For which course number?';
            this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);

        } else if (!search(getNames(this.attributes.courses[slotsObj.CourseNumber.value]), slotsObj.Student.value)) {
            let slotToElicit = 'Student';
            let SpeechOutput = 'For which student?';
            this.emit(':elicitSlot', slotToElicit, speechOutput, speechOutput);

        } else {
            const courseNumber = slotsObj.CourseNumber.value;
            const student = slotsObj.Student.value;
            const index = indexOf(this.attributes.courses[courseNumber], student);

            if (slotsObj.Points.value) {
                this.attributes.courses[courseNumber][index].points += slotsObj.Points.value;
                this.response.speak(slotsObj.Points.value.toString() + " points have been assigned to " + student);
            } else {
                this.attributes.courses[courseNumber][index].points++;
                this.response.speak("A point has been assigned to " + student);
            }

            this.emit(":responseReady");
        }
    }

};
