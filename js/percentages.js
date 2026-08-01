from pathlib import Path

code = r'''"use strict";

// ==================================================
// THE MATH FINAL GIRL
// PERCENTAGES & RATIOS MASTER FILE
//
// GitHub-Zwischendatei: percentagesjs.html
// Später umbenennen in: percentages.js
//
// Diese Datei enthält ausschließlich JavaScript.
// ==================================================


// ==================================================
// 01. ZENTRALE EINSTELLUNGEN
// ==================================================

const PERCENTAGES_CONFIG = {
    exerciseAreaId: "percentage-exercise-area",
    titleId: "percentage-exercise-title",
    problemId: "percentage-problem",
    visualId: "percentage-visual",
    questionId: "percentage-question",
    exampleId: "percentage-example",
    answerId: "percentage-answer",
    checkButtonId: "percentage-check-answer",
    newProblemButtonId: "percentage-new-problem",
    feedbackId: "percentage-feedback",

    generatorButtonSelector: "[data-percentage-generator]",

    hiddenClass: "is-hidden",
    activeButtonClass: "active",
    correctFeedbackClass: "correct",
    incorrectFeedbackClass: "incorrect"
};


// ==================================================
// 02. ZENTRALER STATUS
// ==================================================

const percentagesState = {
    activeGeneratorNumber: null,
    currentProblem: null,
    answerChecked: false,
    activeGeneratorNumbers: []
};


// ==================================================
// 03. GENERATOR-REGISTRIERUNG
// ==================================================

const percentageGenerators = new Map();


function registerPercentageGenerator(generatorNumber, generatorDefinition) {
    const number = Number(generatorNumber);

    if (!Number.isInteger(number) || number < 1 || number > 20) {
        throw new Error("Generator number must be an integer from 1 to 20.");
    }

    if (!generatorDefinition || typeof generatorDefinition !== "object") {
        throw new Error(`Generator ${number} must be registered with an object.`);
    }

    if (typeof generatorDefinition.createProblem !== "function") {
        throw new Error(`Generator ${number} requires a createProblem function.`);
    }

    if (typeof generatorDefinition.checkAnswer !== "function") {
        throw new Error(`Generator ${number} requires a checkAnswer function.`);
    }

    percentageGenerators.set(number, {
        number,
        title:
            typeof generatorDefinition.title === "string"
                ? generatorDefinition.title
                : `Generator ${String(number).padStart(2, "0")}`,
        createProblem: generatorDefinition.createProblem,
        checkAnswer: generatorDefinition.checkAnswer,
        renderProblem:
            typeof generatorDefinition.renderProblem === "function"
                ? generatorDefinition.renderProblem
                : null,
        formatCorrectFeedback:
            typeof generatorDefinition.formatCorrectFeedback === "function"
                ? generatorDefinition.formatCorrectFeedback
                : null,
        formatIncorrectFeedback:
            typeof generatorDefinition.formatIncorrectFeedback === "function"
                ? generatorDefinition.formatIncorrectFeedback
                : null
    });

    updateAvailableGenerators();
}


// ==================================================
// 04. INITIALISIERUNG
// ==================================================

document.addEventListener("DOMContentLoaded", initializePercentagesPage);


function initializePercentagesPage() {
    connectGeneratorButtons();
    connectAnswerField();
    connectCheckAnswerButton();
    connectNewProblemButton();

    updateAvailableGenerators();
    deactivateUnavailableGeneratorButtons();
}


// ==================================================
// 05. HTML-ELEMENTE
// ==================================================

function getPercentageElement(elementId) {
    return document.getElementById(elementId);
}


function getExerciseArea() {
    return getPercentageElement(PERCENTAGES_CONFIG.exerciseAreaId);
}


function getExerciseTitleElement() {
    return getPercentageElement(PERCENTAGES_CONFIG.titleId);
}


function getProblemElement() {
    return getPercentageElement(PERCENTAGES_CONFIG.problemId);
}


function getVisualElement() {
    return getPercentageElement(PERCENTAGES_CONFIG.visualId);
}


function getQuestionElement() {
    return getPercentageElement(PERCENTAGES_CONFIG.questionId);
}


function getExampleElement() {
    return getPercentageElement(PERCENTAGES_CONFIG.exampleId);
}


function getAnswerField() {
    return getPercentageElement(PERCENTAGES_CONFIG.answerId);
}


function getCheckAnswerButton() {
    return getPercentageElement(PERCENTAGES_CONFIG.checkButtonId);
}


function getNewProblemButton() {
    return getPercentageElement(PERCENTAGES_CONFIG.newProblemButtonId);
}


function getFeedbackElement() {
    return getPercentageElement(PERCENTAGES_CONFIG.feedbackId);
}


// ==================================================
// 06. EVENTLISTENER
// ==================================================

function connectGeneratorButtons() {
    document
        .querySelectorAll(PERCENTAGES_CONFIG.generatorButtonSelector)
        .forEach((button) => {
            button.addEventListener("click", handleGeneratorButtonClick);
        });
}


function connectAnswerField() {
    const answerField = getAnswerField();

    if (!answerField) {
        return;
    }

    answerField.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            checkCurrentAnswer();
        }
    });

    answerField.addEventListener("input", () => {
        if (percentagesState.answerChecked) {
            clearFeedback();
            percentagesState.answerChecked = false;
        }
    });
}


function connectCheckAnswerButton() {
    const button = getCheckAnswerButton();

    if (button) {
        button.addEventListener("click", checkCurrentAnswer);
    }
}


function connectNewProblemButton() {
    const button = getNewProblemButton();

    if (button) {
        button.addEventListener("click", createNextProblem);
    }
}


// ==================================================
// 07. GENERATOR-SCHALTFLÄCHEN
// ==================================================

function handleGeneratorButtonClick(event) {
    const generatorNumber = Number(
        event.currentTarget.dataset.percentageGenerator
    );

    if (percentageGenerators.has(generatorNumber)) {
        startPercentageGenerator(generatorNumber);
    }
}


function startPercentageGenerator(generatorNumber) {
    const number = Number(generatorNumber);

    if (!percentageGenerators.has(number)) {
        return;
    }

    percentagesState.activeGeneratorNumber = number;

    markActiveGeneratorButton(number);
    showExerciseArea();
    createNextProblem();
}


function markActiveGeneratorButton(generatorNumber) {
    document
        .querySelectorAll(PERCENTAGES_CONFIG.generatorButtonSelector)
        .forEach((button) => {
            const buttonGeneratorNumber = Number(
                button.dataset.percentageGenerator
            );

            button.classList.toggle(
                PERCENTAGES_CONFIG.activeButtonClass,
                buttonGeneratorNumber === generatorNumber
            );
        });
}


function deactivateUnavailableGeneratorButtons() {
    document
        .querySelectorAll(PERCENTAGES_CONFIG.generatorButtonSelector)
        .forEach((button) => {
            const generatorNumber = Number(
                button.dataset.percentageGenerator
            );

            const isAvailable = percentageGenerators.has(generatorNumber);

            button.disabled = !isAvailable;
            button.setAttribute("aria-disabled", String(!isAvailable));
        });
}


function updateAvailableGenerators() {
    percentagesState.activeGeneratorNumbers = Array.from(
        percentageGenerators.keys()
    ).sort((firstNumber, secondNumber) => {
        return firstNumber - secondNumber;
    });

    deactivateUnavailableGeneratorButtons();
}


// ==================================================
// 08. AUFGABE ERSTELLEN
// ==================================================

function createNextProblem() {
    clearFeedback();
    clearAnswerField();

    percentagesState.answerChecked = false;

    const generatorNumber = percentagesState.activeGeneratorNumber;

    if (
        generatorNumber === null ||
        !percentageGenerators.has(generatorNumber)
    ) {
        return;
    }

    const generator = percentageGenerators.get(generatorNumber);

    try {
        const newProblem = generator.createProblem();

        if (!newProblem || typeof newProblem !== "object") {
            throw new Error(
                `Generator ${generatorNumber} did not return a valid problem object.`
            );
        }

        percentagesState.currentProblem = {
            generatorNumber,
            generator,
            data: newProblem
        };

        renderCurrentProblem();
        focusAnswerField();
    } catch (error) {
        console.error(error);
        showIncorrectFeedback(
            "This exercise could not create a problem. Please choose another exercise."
        );
    }
}


// ==================================================
// 09. AUFGABE ANZEIGEN
// ==================================================

function renderCurrentProblem() {
    if (!percentagesState.currentProblem) {
        return;
    }

    const currentProblem = percentagesState.currentProblem;
    const generator = currentProblem.generator;
    const problemData = currentProblem.data;

    setExerciseTitle(generator.title);
    clearProblemDisplay();

    if (generator.renderProblem) {
        generator.renderProblem({
            problem: problemData,
            elements: {
                exerciseArea: getExerciseArea(),
                title: getExerciseTitleElement(),
                problem: getProblemElement(),
                visual: getVisualElement(),
                question: getQuestionElement(),
                example: getExampleElement(),
                answer: getAnswerField(),
                feedback: getFeedbackElement()
            },
            helpers: percentageHelperFunctions
        });

        return;
    }

    renderStandardProblem(problemData);
}


function renderStandardProblem(problemData) {
    const problemElement = getProblemElement();
    const questionElement = getQuestionElement();
    const exampleElement = getExampleElement();
    const visualElement = getVisualElement();

    if (problemElement) {
        problemElement.textContent =
            typeof problemData.problemText === "string"
                ? problemData.problemText
                : "";
    }

    if (questionElement) {
        questionElement.textContent =
            typeof problemData.questionText === "string"
                ? problemData.questionText
                : "";
    }

    if (exampleElement) {
        exampleElement.textContent =
            typeof problemData.exampleText === "string"
                ? problemData.exampleText
                : "";
    }

    if (visualElement) {
        visualElement.replaceChildren();
    }
}


function clearProblemDisplay() {
    const problemElement = getProblemElement();
    const questionElement = getQuestionElement();
    const exampleElement = getExampleElement();
    const visualElement = getVisualElement();

    if (problemElement) {
        problemElement.textContent = "";
    }

    if (questionElement) {
        questionElement.textContent = "";
    }

    if (exampleElement) {
        exampleElement.textContent = "";
    }

    if (visualElement) {
        visualElement.replaceChildren();
        visualElement.removeAttribute("style");
    }
}


function setExerciseTitle(title) {
    const titleElement = getExerciseTitleElement();

    if (titleElement) {
        titleElement.textContent = title;
    }
}


function showExerciseArea() {
    const exerciseArea = getExerciseArea();

    if (!exerciseArea) {
        return;
    }

    exerciseArea.hidden = false;
    exerciseArea.classList.remove(PERCENTAGES_CONFIG.hiddenClass);

    exerciseArea.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==================================================
// 10. ANTWORT PRÜFEN
// ==================================================

function checkCurrentAnswer() {
    if (!percentagesState.currentProblem) {
        return;
    }

    const answerField = getAnswerField();

    if (!answerField) {
        return;
    }

    const userAnswer = answerField.value.trim();

    if (userAnswer === "") {
        showIncorrectFeedback("Please enter an answer.");
        return;
    }

    const currentProblem = percentagesState.currentProblem;
    const generator = currentProblem.generator;

    let result;

    try {
        result = generator.checkAnswer({
            userAnswer,
            problem: currentProblem.data,
            helpers: percentageHelperFunctions
        });
    } catch (error) {
        console.error(error);
        showIncorrectFeedback(
            "This exercise could not check the answer. Please try a new problem."
        );
        return;
    }

    const normalizedResult = normalizeCheckResult(result);

    percentagesState.answerChecked = true;

    if (normalizedResult.correct) {
        showCorrectFeedback(
            createCorrectFeedbackMessage(
                generator,
                normalizedResult,
                currentProblem.data
            )
        );
        return;
    }

    showIncorrectFeedback(
        createIncorrectFeedbackMessage(
            generator,
            normalizedResult,
            currentProblem.data
        )
    );
}


function normalizeCheckResult(result) {
    if (typeof result === "boolean") {
        return {
            correct: result,
            message: "",
            simplifiedAnswer: "",
            expectedAnswer: ""
        };
    }

    if (!result || typeof result !== "object") {
        return {
            correct: false,
            message: "",
            simplifiedAnswer: "",
            expectedAnswer: ""
        };
    }

    return {
        correct: result.correct === true,
        message:
            typeof result.message === "string"
                ? result.message
                : "",
        simplifiedAnswer:
            typeof result.simplifiedAnswer === "string"
                ? result.simplifiedAnswer
                : "",
        expectedAnswer:
            typeof result.expectedAnswer === "string"
                ? result.expectedAnswer
                : ""
    };
}


function createCorrectFeedbackMessage(
    generator,
    result,
    problemData
) {
    if (result.message) {
        return result.message;
    }

    if (generator.formatCorrectFeedback) {
        return generator.formatCorrectFeedback({
            result,
            problem: problemData,
            helpers: percentageHelperFunctions
        });
    }

    if (result.simplifiedAnswer) {
        return `Correct. Simplified answer: ${result.simplifiedAnswer}`;
    }

    if (result.expectedAnswer) {
        return `Correct. Answer: ${result.expectedAnswer}`;
    }

    return "Correct.";
}


function createIncorrectFeedbackMessage(
    generator,
    result,
    problemData
) {
    if (result.message) {
        return result.message;
    }

    if (generator.formatIncorrectFeedback) {
        return generator.formatIncorrectFeedback({
            result,
            problem: problemData,
            helpers: percentageHelperFunctions
        });
    }

    return "Not quite. Try again.";
}


// ==================================================
// 11. FEEDBACK
// ==================================================

function showCorrectFeedback(message) {
    const feedbackElement = getFeedbackElement();

    if (!feedbackElement) {
        return;
    }

    feedbackElement.textContent = message;
    feedbackElement.hidden = false;
    feedbackElement.classList.add(
        PERCENTAGES_CONFIG.correctFeedbackClass
    );
    feedbackElement.classList.remove(
        PERCENTAGES_CONFIG.incorrectFeedbackClass
    );
    feedbackElement.setAttribute("role", "status");
    feedbackElement.setAttribute("aria-live", "polite");
}


function showIncorrectFeedback(message) {
    const feedbackElement = getFeedbackElement();

    if (!feedbackElement) {
        return;
    }

    feedbackElement.textContent = message;
    feedbackElement.hidden = false;
    feedbackElement.classList.add(
        PERCENTAGES_CONFIG.incorrectFeedbackClass
    );
    feedbackElement.classList.remove(
        PERCENTAGES_CONFIG.correctFeedbackClass
    );
    feedbackElement.setAttribute("role", "alert");
    feedbackElement.setAttribute("aria-live", "assertive");
}


function clearFeedback() {
    const feedbackElement = getFeedbackElement();

    if (!feedbackElement) {
        return;
    }

    feedbackElement.textContent = "";
    feedbackElement.hidden = true;
    feedbackElement.classList.remove(
        PERCENTAGES_CONFIG.correctFeedbackClass,
        PERCENTAGES_CONFIG.incorrectFeedbackClass
    );
}


// ==================================================
// 12. EINGABEFELD
// ==================================================

function clearAnswerField() {
    const answerField = getAnswerField();

    if (answerField) {
        answerField.value = "";
    }
}


function focusAnswerField() {
    const answerField = getAnswerField();

    if (!answerField) {
        return;
    }

    window.setTimeout(() => {
        answerField.focus({
            preventScroll: true
        });
    }, 0);
}


// ==================================================
// 13. MATHEMATISCHE HILFSFUNKTIONEN
// ==================================================

function greatestCommonDivisor(firstNumber, secondNumber) {
    let first = Math.abs(Number(firstNumber));
    let second = Math.abs(Number(secondNumber));

    if (!Number.isInteger(first) || !Number.isInteger(second)) {
        return 1;
    }

    while (second !== 0) {
        const remainder = first % second;
        first = second;
        second = remainder;
    }

    return first === 0 ? 1 : first;
}


function simplifyFraction(numerator, denominator) {
    let top = Number(numerator);
    let bottom = Number(denominator);

    if (
        !Number.isInteger(top) ||
        !Number.isInteger(bottom) ||
        bottom === 0
    ) {
        return null;
    }

    if (bottom < 0) {
        top *= -1;
        bottom *= -1;
    }

    const divisor = greatestCommonDivisor(top, bottom);

    return {
        numerator: top / divisor,
        denominator: bottom / divisor
    };
}


function formatFraction(numerator, denominator) {
    const simplified = simplifyFraction(numerator, denominator);

    if (!simplified) {
        return "";
    }

    if (simplified.denominator === 1) {
        return String(simplified.numerator);
    }

    return `${simplified.numerator}/${simplified.denominator}`;
}


function parseFraction(value) {
    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue = value
        .trim()
        .replace(/\s+/g, "");

    const match = normalizedValue.match(
        /^([+-]?\d+)\/([+-]?\d+)$/
    );

    if (!match) {
        return null;
    }

    const numerator = Number(match[1]);
    const denominator = Number(match[2]);

    if (
        !Number.isInteger(numerator) ||
        !Number.isInteger(denominator) ||
        denominator === 0
    ) {
        return null;
    }

    return simplifyFraction(numerator, denominator);
}


function parseNumber(value) {
    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue = value
        .trim()
        .replace(",", ".")
        .replace(/[%$€£]/g, "")
        .replace(/\s+/g, "");

    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalizedValue)) {
        return null;
    }

    const number = Number(normalizedValue);

    return Number.isFinite(number) ? number : null;
}


function parsePercentage(value) {
    return parseNumber(value);
}


function parseRatio(value) {
    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue = value
        .trim()
        .replace(/\s+/g, "");

    const match = normalizedValue.match(
        /^([+-]?\d+):([+-]?\d+)$/
    );

    if (!match) {
        return null;
    }

    const first = Number(match[1]);
    const second = Number(match[2]);

    if (
        !Number.isInteger(first) ||
        !Number.isInteger(second) ||
        first <= 0 ||
        second <= 0
    ) {
        return null;
    }

    return {
        first,
        second
    };
}


function simplifyRatio(first, second) {
    const divisor = greatestCommonDivisor(first, second);

    return {
        first: first / divisor,
        second: second / divisor
    };
}


function formatRatio(first, second) {
    const simplified = simplifyRatio(first, second);
    return `${simplified.first}:${simplified.second}`;
}


function numbersAreClose(first, second, tolerance = 0.000001) {
    return Math.abs(Number(first) - Number(second)) <= tolerance;
}


function roundTo(value, decimalPlaces = 2) {
    const factor = 10 ** decimalPlaces;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}


function formatNumber(value, decimalPlaces = 2) {
    const rounded = roundTo(value, decimalPlaces);

    if (Number.isInteger(rounded)) {
        return String(rounded);
    }

    return String(rounded);
}


function formatMoney(value) {
    return formatNumber(value, 2);
}


// ==================================================
// 14. ALLGEMEINE HILFSFUNKTIONEN
// ==================================================

function randomInteger(minimum, maximum) {
    const min = Math.ceil(Number(minimum));
    const max = Math.floor(Number(maximum));

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}


function randomItem(items) {
    if (!Array.isArray(items) || items.length === 0) {
        return null;
    }

    return items[randomInteger(0, items.length - 1)];
}


function createPlainProblem(problemText, questionText, exampleText) {
    return {
        problemText,
        questionText,
        exampleText
    };
}


// ==================================================
// 15. HILFSFUNKTIONEN FÜR GENERATOREN
// ==================================================

const percentageHelperFunctions = Object.freeze({
    greatestCommonDivisor,
    simplifyFraction,
    formatFraction,
    parseFraction,
    parseNumber,
    parsePercentage,
    parseRatio,
    simplifyRatio,
    formatRatio,
    numbersAreClose,
    roundTo,
    formatNumber,
    formatMoney,
    randomInteger,
    randomItem,
    createPlainProblem,
    showCorrectFeedback,
    showIncorrectFeedback,
    clearFeedback
});


// ==================================================
// GENERATOR 01: Convert percentage → decimal
// ==================================================

registerPercentageGenerator(1, {
    title: "Convert percentage → decimal",

    createProblem() {
        const percentage = randomInteger(1, 250);

        return createPlainProblem(
            `${percentage}%`,
            "Convert the percentage to a decimal.",
            "Example: 35% → 0.35"
        );
    },

    checkAnswer(context) {
        const answer = parseNumber(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a decimal number."
            };
        }

        const percentage = Number(
            context.problem.problemText.replace("%", "")
        );
        const expected = percentage / 100;

        if (numbersAreClose(answer, expected)) {
            return {
                correct: true,
                expectedAnswer: formatNumber(expected, 4)
            };
        }

        return {
            correct: false,
            message: "Not quite. Divide the percentage by 100."
        };
    }
});


// ==================================================
// GENERATOR 02: Convert decimal → percentage
// ==================================================

registerPercentageGenerator(2, {
    title: "Convert decimal → percentage",

    createProblem() {
        const hundredths = randomInteger(1, 250);
        const decimal = hundredths / 100;

        return createPlainProblem(
            formatNumber(decimal, 2),
            "Convert the decimal to a percentage.",
            "Example: 0.35 → 35%"
        );
    },

    checkAnswer(context) {
        const answer = parsePercentage(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a percentage."
            };
        }

        const expected = Number(context.problem.problemText) * 100;

        if (numbersAreClose(answer, expected)) {
            return {
                correct: true,
                expectedAnswer: `${formatNumber(expected, 2)}%`
            };
        }

        return {
            correct: false,
            message: "Not quite. Multiply the decimal by 100."
        };
    }
});


// ==================================================
// GENERATOR 03: Convert fraction → percentage
// ==================================================

registerPercentageGenerator(3, {
    title: "Convert fraction → percentage",

    createProblem() {
        const choices = [
            [1, 2],
            [1, 4],
            [3, 4],
            [1, 5],
            [2, 5],
            [3, 5],
            [4, 5],
            [1, 10],
            [3, 10],
            [7, 10],
            [1, 20],
            [3, 20],
            [7, 20],
            [9, 20]
        ];

        const [numerator, denominator] = randomItem(choices);

        return {
            numerator,
            denominator,
            problemText: `${numerator}/${denominator}`,
            questionText: "Convert the fraction to a percentage.",
            exampleText: "Example: 3/4 → 75%"
        };
    },

    checkAnswer(context) {
        const answer = parsePercentage(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a percentage."
            };
        }

        const expected =
            (context.problem.numerator /
                context.problem.denominator) *
            100;

        if (numbersAreClose(answer, expected)) {
            return {
                correct: true,
                expectedAnswer: `${formatNumber(expected, 2)}%`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Divide the numerator by the denominator, then multiply by 100."
        };
    }
});


// ==================================================
// GENERATOR 04: Convert percentage → fraction
// ==================================================

registerPercentageGenerator(4, {
    title: "Convert percentage → fraction",

    createProblem() {
        const percentage = randomItem([
            5, 10, 15, 20, 25, 30, 35, 40, 45, 50,
            55, 60, 65, 70, 75, 80, 85, 90, 95, 125, 150
        ]);
        const simplified = simplifyFraction(percentage, 100);

        return {
            percentage,
            numerator: simplified.numerator,
            denominator: simplified.denominator,
            problemText: `${percentage}%`,
            questionText: "Convert the percentage to a fraction and simplify it.",
            exampleText: "Example: 75% → 3/4"
        };
    },

    checkAnswer(context) {
        const answer = parseFraction(context.userAnswer);

        if (!answer) {
            return {
                correct: false,
                message: "Please enter a fraction such as 3/4."
            };
        }

        if (
            answer.numerator === context.problem.numerator &&
            answer.denominator === context.problem.denominator
        ) {
            return {
                correct: true,
                simplifiedAnswer: formatFraction(
                    context.problem.numerator,
                    context.problem.denominator
                )
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Write the percentage over 100, then simplify."
        };
    }
});


// ==================================================
// GENERATOR 05: Find x% of a number
// ==================================================

registerPercentageGenerator(5, {
    title: "Find x% of a number",

    createProblem() {
        const percentage = randomItem([
            5, 10, 15, 20, 25, 30, 40, 50, 60, 75
        ]);
        const multiplier = randomInteger(2, 20);
        const number = 100 * multiplier / greatestCommonDivisor(percentage, 100);
        const result = number * percentage / 100;

        return createPlainProblem(
            `${percentage}% of ${number}`,
            "Find the value.",
            "Multiply the number by the percentage as a decimal."
        );
    },

    checkAnswer(context) {
        const answer = parseNumber(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a number."
            };
        }

        const match = context.problem.problemText.match(
            /^(\d+)% of ([\d.]+)$/
        );
        const expected = Number(match[2]) * Number(match[1]) / 100;

        if (numbersAreClose(answer, expected)) {
            return {
                correct: true,
                expectedAnswer: formatNumber(expected, 2)
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Convert the percentage to a decimal and multiply."
        };
    }
});


// ==================================================
// GENERATOR 06: What percentage is one number of another?
// ==================================================

registerPercentageGenerator(6, {
    title: "What percentage is one number of another?",

    createProblem() {
        const percentage = randomItem([
            10, 20, 25, 30, 40, 50, 60, 75, 80, 90
        ]);
        const whole = randomInteger(2, 20) * 10;
        const part = whole * percentage / 100;

        return {
            part,
            whole,
            percentage,
            problemText: `${part} is what percentage of ${whole}?`,
            questionText: "Enter the percentage.",
            exampleText: "Divide the part by the whole, then multiply by 100."
        };
    },

    checkAnswer(context) {
        const answer = parsePercentage(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a percentage."
            };
        }

        if (numbersAreClose(answer, context.problem.percentage)) {
            return {
                correct: true,
                expectedAnswer:
                    `${formatNumber(context.problem.percentage, 2)}%`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Divide the part by the whole, then multiply by 100."
        };
    }
});


// ==================================================
// GENERATOR 07: Find the whole from part and percentage
// ==================================================

registerPercentageGenerator(7, {
    title: "Find the whole from part and percentage",

    createProblem() {
        const percentage = randomItem([
            10, 20, 25, 40, 50, 60, 75, 80
        ]);
        const whole = randomInteger(2, 20) * 10;
        const part = whole * percentage / 100;

        return {
            part,
            percentage,
            whole,
            problemText: `${part} is ${percentage}% of what number?`,
            questionText: "Find the whole.",
            exampleText: "Divide the part by the percentage as a decimal."
        };
    },

    checkAnswer(context) {
        const answer = parseNumber(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a number."
            };
        }

        if (numbersAreClose(answer, context.problem.whole)) {
            return {
                correct: true,
                expectedAnswer: formatNumber(context.problem.whole, 2)
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Divide the part by the percentage as a decimal."
        };
    }
});


// ==================================================
// GENERATOR 08: Increase by x%
// ==================================================

registerPercentageGenerator(8, {
    title: "Increase by x%",

    createProblem() {
        const original = randomInteger(2, 40) * 5;
        const percentage = randomItem([
            5, 10, 15, 20, 25, 30, 40, 50
        ]);
        const result = original * (1 + percentage / 100);

        return {
            original,
            percentage,
            result,
            problemText: `Increase ${original} by ${percentage}%`,
            questionText: "Find the new value.",
            exampleText: "Multiply by 1 plus the percentage as a decimal."
        };
    },

    checkAnswer(context) {
        const answer = parseNumber(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a number."
            };
        }

        if (numbersAreClose(answer, context.problem.result)) {
            return {
                correct: true,
                expectedAnswer: formatNumber(context.problem.result, 2)
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Find the increase and add it to the original value."
        };
    }
});


// ==================================================
// GENERATOR 09: Decrease by x%
// ==================================================

registerPercentageGenerator(9, {
    title: "Decrease by x%",

    createProblem() {
        const original = randomInteger(2, 40) * 5;
        const percentage = randomItem([
            5, 10, 15, 20, 25, 30, 40, 50
        ]);
        const result = original * (1 - percentage / 100);

        return {
            original,
            percentage,
            result,
            problemText: `Decrease ${original} by ${percentage}%`,
            questionText: "Find the new value.",
            exampleText: "Multiply by 1 minus the percentage as a decimal."
        };
    },

    checkAnswer(context) {
        const answer = parseNumber(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a number."
            };
        }

        if (numbersAreClose(answer, context.problem.result)) {
            return {
                correct: true,
                expectedAnswer: formatNumber(context.problem.result, 2)
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Find the decrease and subtract it from the original value."
        };
    }
});


// ==================================================
// GENERATOR 10: Percentage increase
// ==================================================

registerPercentageGenerator(10, {
    title: "Percentage increase",

    createProblem() {
        const oldValue = randomInteger(2, 20) * 10;
        const percentage = randomItem([
            10, 20, 25, 30, 40, 50, 60, 75
        ]);
        const newValue = oldValue * (1 + percentage / 100);

        return {
            oldValue,
            newValue,
            percentage,
            problemText: `${oldValue} → ${formatNumber(newValue, 2)}`,
            questionText: "What is the percentage increase?",
            exampleText: "Increase ÷ original × 100."
        };
    },

    checkAnswer(context) {
        const answer = parsePercentage(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a percentage."
            };
        }

        if (numbersAreClose(answer, context.problem.percentage)) {
            return {
                correct: true,
                expectedAnswer:
                    `${formatNumber(context.problem.percentage, 2)}%`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Divide the increase by the original value, then multiply by 100."
        };
    }
});


// ==================================================
// GENERATOR 11: Percentage decrease
// ==================================================

registerPercentageGenerator(11, {
    title: "Percentage decrease",

    createProblem() {
        const oldValue = randomInteger(2, 20) * 10;
        const percentage = randomItem([
            10, 20, 25, 30, 40, 50, 60, 75
        ]);
        const newValue = oldValue * (1 - percentage / 100);

        return {
            oldValue,
            newValue,
            percentage,
            problemText: `${oldValue} → ${formatNumber(newValue, 2)}`,
            questionText: "What is the percentage decrease?",
            exampleText: "Decrease ÷ original × 100."
        };
    },

    checkAnswer(context) {
        const answer = parsePercentage(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a percentage."
            };
        }

        if (numbersAreClose(answer, context.problem.percentage)) {
            return {
                correct: true,
                expectedAnswer:
                    `${formatNumber(context.problem.percentage, 2)}%`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Divide the decrease by the original value, then multiply by 100."
        };
    }
});


// ==================================================
// GENERATOR 12: Percentage change
// ==================================================

registerPercentageGenerator(12, {
    title: "Percentage change",

    createProblem() {
        const oldValue = randomInteger(2, 20) * 10;
        const percentage = randomItem([
            10, 20, 25, 30, 40, 50
        ]);
        const direction = randomItem(["increase", "decrease"]);
        const factor =
            direction === "increase"
                ? 1 + percentage / 100
                : 1 - percentage / 100;
        const newValue = oldValue * factor;

        return {
            oldValue,
            newValue,
            percentage,
            direction,
            problemText: `${oldValue} → ${formatNumber(newValue, 2)}`,
            questionText:
                "Find the percentage change. Use a negative number for a decrease.",
            exampleText:
                "Change ÷ original × 100."
        };
    },

    checkAnswer(context) {
        const answer = parsePercentage(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a percentage."
            };
        }

        const expected =
            context.problem.direction === "increase"
                ? context.problem.percentage
                : -context.problem.percentage;

        if (numbersAreClose(answer, expected)) {
            return {
                correct: true,
                expectedAnswer: `${formatNumber(expected, 2)}%`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Divide the change by the original value, then multiply by 100."
        };
    }
});


// ==================================================
// GENERATOR 13: Simplify ratios
// ==================================================

registerPercentageGenerator(13, {
    title: "Simplify ratios",

    createProblem() {
        const first = randomInteger(1, 12);
        const second = randomInteger(1, 12);
        const multiplier = randomInteger(2, 10);

        return {
            first: first * multiplier,
            second: second * multiplier,
            simplified: simplifyRatio(first, second),
            problemText: `${first * multiplier}:${second * multiplier}`,
            questionText: "Simplify the ratio.",
            exampleText: "Divide both parts by their greatest common divisor."
        };
    },

    checkAnswer(context) {
        const answer = parseRatio(context.userAnswer);

        if (!answer) {
            return {
                correct: false,
                message: "Please enter a ratio such as 3:4."
            };
        }

        const simplified = simplifyRatio(answer.first, answer.second);

        if (
            simplified.first === context.problem.simplified.first &&
            simplified.second === context.problem.simplified.second
        ) {
            return {
                correct: true,
                simplifiedAnswer: formatRatio(
                    context.problem.simplified.first,
                    context.problem.simplified.second
                )
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Divide both parts by their greatest common divisor."
        };
    }
});


// ==================================================
// GENERATOR 14: Equivalent ratios
// ==================================================

registerPercentageGenerator(14, {
    title: "Equivalent ratios",

    createProblem() {
        const first = randomInteger(1, 12);
        const second = randomInteger(1, 12);
        const multiplier = randomInteger(2, 10);
        const missingSide = randomItem(["first", "second"]);

        return {
            first,
            second,
            multiplier,
            equivalentFirst: first * multiplier,
            equivalentSecond: second * multiplier,
            missingSide,
            problemText:
                missingSide === "first"
                    ? `${first}:${second} = ?:${second * multiplier}`
                    : `${first}:${second} = ${first * multiplier}:?`,
            questionText: "Find the missing value.",
            exampleText: "Multiply both parts of the ratio by the same number."
        };
    },

    checkAnswer(context) {
        const answer = parseNumber(context.userAnswer);

        if (answer === null || !Number.isInteger(answer)) {
            return {
                correct: false,
                message: "Please enter a whole number."
            };
        }

        const expected =
            context.problem.missingSide === "first"
                ? context.problem.equivalentFirst
                : context.problem.equivalentSecond;

        if (answer === expected) {
            return {
                correct: true,
                expectedAnswer: String(expected)
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Multiply both parts of the ratio by the same number."
        };
    }
});


// ==================================================
// GENERATOR 15: Divide in a ratio
// ==================================================

registerPercentageGenerator(15, {
    title: "Divide in a ratio",

    createProblem() {
        const first = randomInteger(1, 8);
        const second = randomInteger(1, 8);
        const unit = randomInteger(2, 20);
        const total = (first + second) * unit;

        return {
            first,
            second,
            total,
            firstShare: first * unit,
            secondShare: second * unit,
            problemText: `Divide ${total} in the ratio ${first}:${second}`,
            questionText: "Enter the two shares separated by a comma.",
            exampleText: "Example: 30, 20"
        };
    },

    checkAnswer(context) {
        const parts = context.userAnswer
            .split(",")
            .map((part) => parseNumber(part));

        if (
            parts.length !== 2 ||
            parts.some((part) => part === null)
        ) {
            return {
                correct: false,
                message:
                    "Please enter two numbers separated by a comma."
            };
        }

        if (
            numbersAreClose(parts[0], context.problem.firstShare) &&
            numbersAreClose(parts[1], context.problem.secondShare)
        ) {
            return {
                correct: true,
                expectedAnswer:
                    `${formatNumber(context.problem.firstShare)}, ${formatNumber(context.problem.secondShare)}`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Add the ratio parts, divide the total by that sum, then multiply."
        };
    }
});


// ==================================================
// GENERATOR 16: Missing value in a ratio
// ==================================================

registerPercentageGenerator(16, {
    title: "Missing value in a ratio",

    createProblem() {
        const first = randomInteger(1, 12);
        const second = randomInteger(1, 12);
        const multiplier = randomInteger(2, 10);
        const missingPosition = randomItem([1, 2, 3, 4]);

        const values = [
            first,
            second,
            first * multiplier,
            second * multiplier
        ];

        const display = values.map((value, index) => {
            return index + 1 === missingPosition ? "?" : value;
        });

        return {
            values,
            missingPosition,
            expected: values[missingPosition - 1],
            problemText:
                `${display[0]}:${display[1]} = ${display[2]}:${display[3]}`,
            questionText: "Find the missing value.",
            exampleText: "Use the same scale factor on both sides."
        };
    },

    checkAnswer(context) {
        const answer = parseNumber(context.userAnswer);

        if (answer === null || !Number.isInteger(answer)) {
            return {
                correct: false,
                message: "Please enter a whole number."
            };
        }

        if (answer === context.problem.expected) {
            return {
                correct: true,
                expectedAnswer: String(context.problem.expected)
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Use the same scale factor on both sides."
        };
    }
});


// ==================================================
// GENERATOR 17: Discounts
// ==================================================

registerPercentageGenerator(17, {
    title: "Discounts",

    createProblem() {
        const originalPrice = randomInteger(2, 40) * 5;
        const discount = randomItem([
            5, 10, 15, 20, 25, 30, 40, 50
        ]);
        const salePrice =
            originalPrice * (1 - discount / 100);

        return {
            originalPrice,
            discount,
            salePrice,
            problemText:
                `$${originalPrice} with ${discount}% off`,
            questionText: "What is the sale price?",
            exampleText: "Subtract the discount from the original price."
        };
    },

    checkAnswer(context) {
        const answer = parseNumber(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a price."
            };
        }

        if (numbersAreClose(answer, context.problem.salePrice)) {
            return {
                correct: true,
                expectedAnswer:
                    `$${formatMoney(context.problem.salePrice)}`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Find the discount amount and subtract it from the original price."
        };
    }
});


// ==================================================
// GENERATOR 18: Sales tax / VAT
// ==================================================

registerPercentageGenerator(18, {
    title: "Sales tax / VAT",

    createProblem() {
        const price = randomInteger(2, 40) * 5;
        const taxRate = randomItem([
            5, 7, 8, 10, 15, 20
        ]);
        const total = price * (1 + taxRate / 100);

        return {
            price,
            taxRate,
            total,
            problemText:
                `$${price} plus ${taxRate}% tax`,
            questionText: "What is the total price?",
            exampleText: "Add the tax amount to the original price."
        };
    },

    checkAnswer(context) {
        const answer = parseNumber(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter a price."
            };
        }

        if (numbersAreClose(answer, context.problem.total)) {
            return {
                correct: true,
                expectedAnswer:
                    `$${formatMoney(context.problem.total)}`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Find the tax amount and add it to the original price."
        };
    }
});


// ==================================================
// GENERATOR 19: Simple interest
// ==================================================

registerPercentageGenerator(19, {
    title: "Simple interest",

    createProblem() {
        const principal = randomInteger(2, 20) * 100;
        const rate = randomItem([
            2, 3, 4, 5, 6, 8, 10
        ]);
        const years = randomInteger(1, 10);
        const interest = principal * rate / 100 * years;

        return {
            principal,
            rate,
            years,
            interest,
            problemText:
                `$${principal} at ${rate}% for ${years} year${years === 1 ? "" : "s"}`,
            questionText: "Find the simple interest.",
            exampleText: "Interest = principal × rate × time."
        };
    },

    checkAnswer(context) {
        const answer = parseNumber(context.userAnswer);

        if (answer === null) {
            return {
                correct: false,
                message: "Please enter an amount."
            };
        }

        if (numbersAreClose(answer, context.problem.interest)) {
            return {
                correct: true,
                expectedAnswer:
                    `$${formatMoney(context.problem.interest)}`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Multiply principal × rate as a decimal × time."
        };
    }
});


// ==================================================
// GENERATOR 20: Mixed Practice
// ==================================================

registerPercentageGenerator(20, {
    title: "Mixed Practice",

    createProblem() {
        const selectedNumber = randomInteger(1, 19);
        const selectedGenerator =
            percentageGenerators.get(selectedNumber);
        const selectedProblem =
            selectedGenerator.createProblem();

        return {
            selectedNumber,
            selectedGenerator,
            selectedProblem
        };
    },

    renderProblem(context) {
        const selectedGenerator =
            context.problem.selectedGenerator;
        const selectedProblem =
            context.problem.selectedProblem;

        context.elements.title.textContent =
            `Mixed Practice · ${selectedGenerator.title}`;

        if (selectedGenerator.renderProblem) {
            selectedGenerator.renderProblem({
                problem: selectedProblem,
                elements: context.elements,
                helpers: percentageHelperFunctions
            });
            return;
        }

        const problemElement = context.elements.problem;
        const questionElement = context.elements.question;
        const exampleElement = context.elements.example;
        const visualElement = context.elements.visual;

        if (problemElement) {
            problemElement.textContent =
                selectedProblem.problemText || "";
        }

        if (questionElement) {
            questionElement.textContent =
                selectedProblem.questionText || "";
        }

        if (exampleElement) {
            exampleElement.textContent =
                selectedProblem.exampleText || "";
        }

        if (visualElement) {
            visualElement.replaceChildren();
        }
    },

    checkAnswer(context) {
        return context.problem.selectedGenerator.checkAnswer({
            userAnswer: context.userAnswer,
            problem: context.problem.selectedProblem,
            helpers: percentageHelperFunctions
        });
    },

    formatCorrectFeedback(context) {
        const selectedGenerator =
            context.problem.selectedGenerator;

        if (selectedGenerator.formatCorrectFeedback) {
            return selectedGenerator.formatCorrectFeedback({
                result: context.result,
                problem: context.problem.selectedProblem,
                helpers: percentageHelperFunctions
            });
        }

        if (context.result.simplifiedAnswer) {
            return `Correct. Simplified answer: ${context.result.simplifiedAnswer}`;
        }

        if (context.result.expectedAnswer) {
            return `Correct. Answer: ${context.result.expectedAnswer}`;
        }

        return "Correct.";
    },

    formatIncorrectFeedback(context) {
        const selectedGenerator =
            context.problem.selectedGenerator;

        if (selectedGenerator.formatIncorrectFeedback) {
            return selectedGenerator.formatIncorrectFeedback({
                result: context.result,
                problem: context.problem.selectedProblem,
                helpers: percentageHelperFunctions
            });
        }

        return "Not quite. Try again.";
    }
});


// ==================================================
// ENDE DER DATEI
// ==================================================
'''

out = Path("/mnt/data/percentagesjs.html")
out.write_text(code, encoding="utf-8")
print(out)
