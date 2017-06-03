'use strict';

/**
 * This is a skill for a guessing number game 
 **/


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: ` ${title}`,
            content: `${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Guess a Number';
    const speechOutput = 'Welcome to Guess a Number game. ' +
        'You can ask me to pick a number';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'you can ask me to pick a number.';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Thanks for playing with me';
    const speechOutput = 'Thank you for trying the Guess a Number Game. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

/**
 * Pick up a number for the user
 */
var pickedNumber; 
 
function pickANumber(intent, session, callback) {
    const cardTitle = intent.name;
    pickedNumber = Math.floor(Math.random()*100);
    let sessionAttributes = {};
    let repromptText = '';
    const shouldEndSession = false;
    let speechOutput = '';
    speechOutput = "I have now picked a number from one to one hundred, start guessing";
    callback(sessionAttributes, 
    buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
} 
 
function tellMeTheAnswer(intent, session, callback) {
    const cardTitle = intent.name;
    let sessionAttributes = {};
    let repromptText = '';
    const shouldEndSession = false;
    let speechOutput = `The Answer is ${pickedNumber}, you can ask me to pick a new number`;
    callback(sessionAttributes, 
    buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}
 
 
function checkTheAnswer(intent, session, callback) {
    const userAnswer = intent.slots.number.value;
    let cardTitle = `Your guess is ${userAnswer}`;
    let repromptText = '';
    let sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = '';
    if (pickedNumber !== null ) {
        if (userAnswer>pickedNumber && userAnswer < 101) {
            speechOutput = `The picked number is smaller than your answer`;
        } else if(userAnswer<pickedNumber) {
            speechOutput = "The picked number is larger than your answer";
        } else if(userAnswer>100) {
            speechOutput = `Your guess ${userAnswer} is larger than 100, please guess again`;
        } else {
            cardTitle = `The picked number is ${userAnswer}`;
            speechOutput = `Boom! ${userAnswer} is the picked number! You can ask me to pick a new number`; 
            shouldEndSession = false;
        }
    }else{
        cardTitle = `Ask me to pick a number`;
        speechOutput = `I haven't picked a number yet, please ask me to pick a number`; 
        shouldEndSession = false;
    }

    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'PickANumber') {
        pickANumber(intent, session, callback);
    } else if (intentName === 'Answer') {
        checkTheAnswer(intent, session, callback);
    } else if (intentName === 'TellMeTheAnswer') {
        tellMeTheAnswer(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
        if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
             callback('Invalid Application ID');
        }
        */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
