"use strict";

// ==================================================
// THE MATH FINAL GIRL
// FRACTIONS
//
// GitHub-Zwischendatei: fractionsjs.html
// Später umbenennen in: fractions.js
//
// Diese Datei enthält ausschließlich JavaScript.
// Keine HTML-Tags in diese Datei einfügen.
// ==================================================


// ==================================================
// 01. ZENTRALE EINSTELLUNGEN
// ==================================================

const FRACTIONS_CONFIG = {
    exerciseAreaId: "fraction-exercise-area",
    titleId: "fraction-exercise-title",
    problemId: "fraction-problem",
    visualId: "fraction-visual",
    questionId: "fraction-question",
    exampleId: "fraction-example",
    answerId: "fraction-answer",
    checkButtonId: "fraction-check-answer",
    newProblemButtonId: "fraction-new-problem",
    feedbackId: "fraction-feedback",

    generatorButtonSelector: "[data-fraction-generator]",
    mixedPracticeButtonSelector: "[data-fraction-mixed-practice]",

    hiddenClass: "is-hidden",
    activeButtonClass: "active",
    correctFeedbackClass: "correct",
    incorrectFeedbackClass: "incorrect"
};


// ==================================================
// 02. ZENTRALER STATUS
// ==================================================

const fractionsState = {
    activeGeneratorNumber: null,
    currentProblem: null,
    answerChecked: false,
    activeGeneratorNumbers: [],
    mixedPracticeActive: false
};


// ==================================================
// 03. GENERATOR-REGISTRIERUNG
// ==================================================

const fractionGenerators = new Map();


function registerFractionGenerator(generatorNumber, generatorDefinition) {
    const number = Number(generatorNumber);

    if (!Number.isInteger(number) || number < 1 || number > 20) {
        throw new Error(
            "Generator number must be an integer from 1 to 20."
        );
    }

    if (
        !generatorDefinition ||
        typeof generatorDefinition !== "object"
    ) {
        throw new Error(
            `Generator ${number} must be registered with an object.`
        );
    }

    if (typeof generatorDefinition.createProblem !== "function") {
        throw new Error(
            `Generator ${number} requires a createProblem function.`
        );
    }

    if (typeof generatorDefinition.checkAnswer !== "function") {
        throw new Error(
            `Generator ${number} requires a checkAnswer function.`
        );
    }

    const normalizedDefinition = {
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
    };

    fractionGenerators.set(number, normalizedDefinition);
    updateAvailableGenerators();
}


// ==================================================
// 04. INITIALISIERUNG
// ==================================================

document.addEventListener("DOMContentLoaded", initializeFractionsPage);


function initializeFractionsPage() {
    connectGeneratorButtons();
    connectMixedPracticeButton();
    connectAnswerField();
    connectCheckAnswerButton();
    connectNewProblemButton();

    updateAvailableGenerators();
    deactivateUnavailableGeneratorButtons();
}


// ==================================================
// 05. ELEMENTE AUS DER HTML-SEITE HOLEN
// ==================================================

function getFractionElement(elementId) {
    return document.getElementById(elementId);
}


function getExerciseArea() {
    return getFractionElement(FRACTIONS_CONFIG.exerciseAreaId);
}


function getExerciseTitleElement() {
    return getFractionElement(FRACTIONS_CONFIG.titleId);
}


function getProblemElement() {
    return getFractionElement(FRACTIONS_CONFIG.problemId);
}


function getVisualElement() {
    return getFractionElement(FRACTIONS_CONFIG.visualId);
}


function getQuestionElement() {
    return getFractionElement(FRACTIONS_CONFIG.questionId);
}


function getExampleElement() {
    return getFractionElement(FRACTIONS_CONFIG.exampleId);
}


function getAnswerField() {
    return getFractionElement(FRACTIONS_CONFIG.answerId);
}


function getCheckAnswerButton() {
    return getFractionElement(FRACTIONS_CONFIG.checkButtonId);
}


function getNewProblemButton() {
    return getFractionElement(FRACTIONS_CONFIG.newProblemButtonId);
}


function getFeedbackElement() {
    return getFractionElement(FRACTIONS_CONFIG.feedbackId);
}


// ==================================================
// 06. EVENTLISTENER
// ==================================================

function connectGeneratorButtons() {
    const buttons = document.querySelectorAll(
        FRACTIONS_CONFIG.generatorButtonSelector
    );

    buttons.forEach((button) => {
        button.addEventListener("click", handleGeneratorButtonClick);
    });
}


function connectMixedPracticeButton() {
    const button = document.querySelector(
        FRACTIONS_CONFIG.mixedPracticeButtonSelector
    );

    if (!button) {
        return;
    }

    button.addEventListener("click", startMixedPractice);
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
        if (fractionsState.answerChecked) {
            clearFeedback();
            fractionsState.answerChecked = false;
        }
    });
}


function connectCheckAnswerButton() {
    const button = getCheckAnswerButton();

    if (!button) {
        return;
    }

    button.addEventListener("click", checkCurrentAnswer);
}


function connectNewProblemButton() {
    const button = getNewProblemButton();

    if (!button) {
        return;
    }

    button.addEventListener("click", createNextProblem);
}


// ==================================================
// 07. GENERATOR-SCHALTFLÄCHEN
// ==================================================

function handleGeneratorButtonClick(event) {
    const button = event.currentTarget;
    const generatorNumber = Number(
        button.dataset.fractionGenerator
    );

    if (!fractionGenerators.has(generatorNumber)) {
        return;
    }

    startFractionGenerator(generatorNumber);
}


function startFractionGenerator(generatorNumber) {
    const number = Number(generatorNumber);

    if (!fractionGenerators.has(number)) {
        return;
    }

    fractionsState.activeGeneratorNumber = number;
    fractionsState.mixedPracticeActive = false;

    markActiveGeneratorButton(number);
    showExerciseArea();
    createNextProblem();
}


function markActiveGeneratorButton(generatorNumber) {
    const buttons = document.querySelectorAll(
        FRACTIONS_CONFIG.generatorButtonSelector
    );

    buttons.forEach((button) => {
        const buttonGeneratorNumber = Number(
            button.dataset.fractionGenerator
        );

        button.classList.toggle(
            FRACTIONS_CONFIG.activeButtonClass,
            buttonGeneratorNumber === generatorNumber
        );
    });

    const mixedPracticeButton = document.querySelector(
        FRACTIONS_CONFIG.mixedPracticeButtonSelector
    );

    if (mixedPracticeButton) {
        mixedPracticeButton.classList.remove(
            FRACTIONS_CONFIG.activeButtonClass
        );
    }
}


function deactivateUnavailableGeneratorButtons() {
    const buttons = document.querySelectorAll(
        FRACTIONS_CONFIG.generatorButtonSelector
    );

    buttons.forEach((button) => {
        const generatorNumber = Number(
            button.dataset.fractionGenerator
        );

        const isAvailable = fractionGenerators.has(generatorNumber);

        button.disabled = !isAvailable;
        button.setAttribute(
            "aria-disabled",
            String(!isAvailable)
        );
    });

    updateMixedPracticeButton();
}


function updateMixedPracticeButton() {
    const button = document.querySelector(
        FRACTIONS_CONFIG.mixedPracticeButtonSelector
    );

    if (!button) {
        return;
    }

    const hasAvailableGenerators =
        fractionsState.activeGeneratorNumbers.length > 0;

    button.disabled = !hasAvailableGenerators;
    button.setAttribute(
        "aria-disabled",
        String(!hasAvailableGenerators)
    );
}


function updateAvailableGenerators() {
    fractionsState.activeGeneratorNumbers = Array.from(
        fractionGenerators.keys()
    ).sort((firstNumber, secondNumber) => {
        return firstNumber - secondNumber;
    });

    deactivateUnavailableGeneratorButtons();
}


// ==================================================
// 08. MIXED PRACTICE
// ==================================================

function startMixedPractice() {
    updateAvailableGenerators();

    if (fractionsState.activeGeneratorNumbers.length === 0) {
        return;
    }

    fractionsState.mixedPracticeActive = true;
    fractionsState.activeGeneratorNumber = null;

    markMixedPracticeButtonActive();
    showExerciseArea();
    createNextProblem();
}


function markMixedPracticeButtonActive() {
    const generatorButtons = document.querySelectorAll(
        FRACTIONS_CONFIG.generatorButtonSelector
    );

    generatorButtons.forEach((button) => {
        button.classList.remove(
            FRACTIONS_CONFIG.activeButtonClass
        );
    });

    const mixedPracticeButton = document.querySelector(
        FRACTIONS_CONFIG.mixedPracticeButtonSelector
    );

    if (mixedPracticeButton) {
        mixedPracticeButton.classList.add(
            FRACTIONS_CONFIG.activeButtonClass
        );
    }
}


function chooseRandomActiveGeneratorNumber() {
    if (fractionsState.activeGeneratorNumbers.length === 0) {
        return null;
    }

    const randomIndex = randomInteger(
        0,
        fractionsState.activeGeneratorNumbers.length - 1
    );

    return fractionsState.activeGeneratorNumbers[randomIndex];
}


// ==================================================
// 09. NEUE AUFGABE ERSTELLEN
// ==================================================

function createNextProblem() {
    clearFeedback();
    clearAnswerField();

    fractionsState.answerChecked = false;

    let generatorNumber =
        fractionsState.activeGeneratorNumber;

    if (fractionsState.mixedPracticeActive) {
        generatorNumber = chooseRandomActiveGeneratorNumber();
    }

    if (
        generatorNumber === null ||
        !fractionGenerators.has(generatorNumber)
    ) {
        return;
    }

    const generator = fractionGenerators.get(generatorNumber);
    const newProblem = generator.createProblem();

    if (!newProblem || typeof newProblem !== "object") {
        throw new Error(
            `Generator ${generatorNumber} did not return a valid problem object.`
        );
    }

    fractionsState.currentProblem = {
        generatorNumber,
        generator,
        data: newProblem
    };

    renderCurrentProblem();
    focusAnswerField();
}


// ==================================================
// 10. AUFGABE ANZEIGEN
// ==================================================

function renderCurrentProblem() {
    if (!fractionsState.currentProblem) {
        return;
    }

    const currentProblem = fractionsState.currentProblem;
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
            helpers: fractionHelperFunctions
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
    }
}


function setExerciseTitle(title) {
    const titleElement = getExerciseTitleElement();

    if (!titleElement) {
        return;
    }

    titleElement.textContent = title;
}


function showExerciseArea() {
    const exerciseArea = getExerciseArea();

    if (!exerciseArea) {
        return;
    }

    exerciseArea.hidden = false;
    exerciseArea.classList.remove(
        FRACTIONS_CONFIG.hiddenClass
    );

    exerciseArea.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


// ==================================================
// 11. ANTWORT PRÜFEN
// ==================================================

function checkCurrentAnswer() {
    if (!fractionsState.currentProblem) {
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

    const currentProblem = fractionsState.currentProblem;
    const generator = currentProblem.generator;

    const result = generator.checkAnswer({
        userAnswer,
        problem: currentProblem.data,
        helpers: fractionHelperFunctions
    });

    const normalizedResult = normalizeCheckResult(result);

    fractionsState.answerChecked = true;

    if (normalizedResult.correct) {
        const message = createCorrectFeedbackMessage(
            generator,
            normalizedResult,
            currentProblem.data
        );

        showCorrectFeedback(message);
        return;
    }

    const message = createIncorrectFeedbackMessage(
        generator,
        normalizedResult,
        currentProblem.data
    );

    showIncorrectFeedback(message);
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
            helpers: fractionHelperFunctions
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
            helpers: fractionHelperFunctions
        });
    }

    return "Not quite. Try again.";
}


// ==================================================
// 12. RÜCKMELDUNG
// ==================================================

function showCorrectFeedback(message) {
    const feedbackElement = getFeedbackElement();

    if (!feedbackElement) {
        return;
    }

    feedbackElement.textContent = message;
    feedbackElement.hidden = false;

    feedbackElement.classList.add(
        FRACTIONS_CONFIG.correctFeedbackClass
    );

    feedbackElement.classList.remove(
        FRACTIONS_CONFIG.incorrectFeedbackClass
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
        FRACTIONS_CONFIG.incorrectFeedbackClass
    );

    feedbackElement.classList.remove(
        FRACTIONS_CONFIG.correctFeedbackClass
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
        FRACTIONS_CONFIG.correctFeedbackClass,
        FRACTIONS_CONFIG.incorrectFeedbackClass
    );
}


// ==================================================
// 13. EINGABEFELD
// ==================================================

function clearAnswerField() {
    const answerField = getAnswerField();

    if (!answerField) {
        return;
    }

    answerField.value = "";
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
// 14. GEMEINSAME MATHEMATISCHE HILFSFUNKTIONEN
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


function leastCommonMultiple(firstNumber, secondNumber) {
    const first = Number(firstNumber);
    const second = Number(secondNumber);

    if (
        !Number.isInteger(first) ||
        !Number.isInteger(second) ||
        first === 0 ||
        second === 0
    ) {
        return 0;
    }

    return Math.abs(
        (first * second) /
        greatestCommonDivisor(first, second)
    );
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
    const simplified = simplifyFraction(
        numerator,
        denominator
    );

    if (!simplified) {
        return "";
    }

    if (simplified.denominator === 1) {
        return String(simplified.numerator);
    }

    return `${simplified.numerator}/${simplified.denominator}`;
}


function formatUnsimplifiedFraction(numerator, denominator) {
    const top = Number(numerator);
    const bottom = Number(denominator);

    if (
        !Number.isInteger(top) ||
        !Number.isInteger(bottom) ||
        bottom === 0
    ) {
        return "";
    }

    return `${top}/${bottom}`;
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

    const simplified = simplifyFraction(
        numerator,
        denominator
    );

    return {
        originalNumerator: numerator,
        originalDenominator: denominator,
        numerator: simplified.numerator,
        denominator: simplified.denominator
    };
}


function fractionsAreEquivalent(
    firstNumerator,
    firstDenominator,
    secondNumerator,
    secondDenominator
) {
    const firstTop = Number(firstNumerator);
    const firstBottom = Number(firstDenominator);
    const secondTop = Number(secondNumerator);
    const secondBottom = Number(secondDenominator);

    if (
        !Number.isInteger(firstTop) ||
        !Number.isInteger(firstBottom) ||
        !Number.isInteger(secondTop) ||
        !Number.isInteger(secondBottom) ||
        firstBottom === 0 ||
        secondBottom === 0
    ) {
        return false;
    }

    return (
        firstTop * secondBottom ===
        secondTop * firstBottom
    );
}


function compareFractions(
    firstNumerator,
    firstDenominator,
    secondNumerator,
    secondDenominator
) {
    const firstValue =
        Number(firstNumerator) *
        Number(secondDenominator);

    const secondValue =
        Number(secondNumerator) *
        Number(firstDenominator);

    if (firstValue < secondValue) {
        return -1;
    }

    if (firstValue > secondValue) {
        return 1;
    }

    return 0;
}


function addFractions(
    firstNumerator,
    firstDenominator,
    secondNumerator,
    secondDenominator
) {
    const numerator =
        firstNumerator * secondDenominator +
        secondNumerator * firstDenominator;

    const denominator =
        firstDenominator * secondDenominator;

    return simplifyFraction(numerator, denominator);
}


function subtractFractions(
    firstNumerator,
    firstDenominator,
    secondNumerator,
    secondDenominator
) {
    const numerator =
        firstNumerator * secondDenominator -
        secondNumerator * firstDenominator;

    const denominator =
        firstDenominator * secondDenominator;

    return simplifyFraction(numerator, denominator);
}


function multiplyFractions(
    firstNumerator,
    firstDenominator,
    secondNumerator,
    secondDenominator
) {
    return simplifyFraction(
        firstNumerator * secondNumerator,
        firstDenominator * secondDenominator
    );
}


function divideFractions(
    firstNumerator,
    firstDenominator,
    secondNumerator,
    secondDenominator
) {
    if (Number(secondNumerator) === 0) {
        return null;
    }

    return simplifyFraction(
        firstNumerator * secondDenominator,
        firstDenominator * secondNumerator
    );
}


function improperFractionToMixedNumber(
    numerator,
    denominator
) {
    const simplified = simplifyFraction(
        numerator,
        denominator
    );

    if (!simplified) {
        return null;
    }

    const wholeNumber = Math.trunc(
        simplified.numerator /
        simplified.denominator
    );

    const remainder = Math.abs(
        simplified.numerator %
        simplified.denominator
    );

    return {
        wholeNumber,
        numerator: remainder,
        denominator: simplified.denominator
    };
}


function mixedNumberToImproperFraction(
    wholeNumber,
    numerator,
    denominator
) {
    const whole = Number(wholeNumber);
    const top = Number(numerator);
    const bottom = Number(denominator);

    if (
        !Number.isInteger(whole) ||
        !Number.isInteger(top) ||
        !Number.isInteger(bottom) ||
        bottom === 0
    ) {
        return null;
    }

    const sign = whole < 0 ? -1 : 1;

    const improperNumerator =
        whole * bottom +
        sign * Math.abs(top);

    return simplifyFraction(
        improperNumerator,
        bottom
    );
}


// ==================================================
// 15. ALLGEMEINE HILFSFUNKTIONEN
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

    return items[
        randomInteger(0, items.length - 1)
    ];
}


function shuffleArray(items) {
    const shuffledItems = [...items];

    for (
        let currentIndex = shuffledItems.length - 1;
        currentIndex > 0;
        currentIndex -= 1
    ) {
        const randomIndex = randomInteger(
            0,
            currentIndex
        );

        [
            shuffledItems[currentIndex],
            shuffledItems[randomIndex]
        ] = [
            shuffledItems[randomIndex],
            shuffledItems[currentIndex]
        ];
    }

    return shuffledItems;
}


function createIntegerRange(start, end) {
    const range = [];

    for (
        let currentNumber = start;
        currentNumber <= end;
        currentNumber += 1
    ) {
        range.push(currentNumber);
    }

    return range;
}


function normalizeTextAnswer(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


function normalizeComparisonSymbol(value) {
    const normalizedValue = String(value)
        .trim()
        .replace(/\s+/g, "");

    if (
        normalizedValue === "<" ||
        normalizedValue === "less" ||
        normalizedValue === "lessthan"
    ) {
        return "<";
    }

    if (
        normalizedValue === ">" ||
        normalizedValue === "greater" ||
        normalizedValue === "greaterthan"
    ) {
        return ">";
    }

    if (
        normalizedValue === "=" ||
        normalizedValue === "==" ||
        normalizedValue === "equal" ||
        normalizedValue === "equals"
    ) {
        return "=";
    }

    return "";
}


// ==================================================
// 16. HILFSFUNKTIONEN FÜR GENERATOREN
// ==================================================

const fractionHelperFunctions = Object.freeze({
    greatestCommonDivisor,
    leastCommonMultiple,
    simplifyFraction,
    formatFraction,
    formatUnsimplifiedFraction,
    parseFraction,
    fractionsAreEquivalent,
    compareFractions,
    addFractions,
    subtractFractions,
    multiplyFractions,
    divideFractions,
    improperFractionToMixedNumber,
    mixedNumberToImproperFraction,
    randomInteger,
    randomItem,
    shuffleArray,
    createIntegerRange,
    normalizeTextAnswer,
    normalizeComparisonSymbol,
    showCorrectFeedback,
    showIncorrectFeedback,
    clearFeedback
});



// ==================================================
// GENERATOR 01: Identify the fraction
// ==================================================

registerFractionGenerator(1, {
    title: "Identify the fraction",

    createProblem() {

        const possibleDenominators = [
            2, 3, 4, 5, 6, 8, 10, 12
        ];

        const denominator = randomItem(possibleDenominators);

        const numerator = randomInteger(
            1,
            denominator - 1
        );

        return {
            numerator,
            denominator,

            questionText: "What fraction is shaded?",
            exampleText: "Example: 1/3"
        };
    },

    renderProblem(context) {

        const problem = context.problem;
        const elements = context.elements;

        const visual = elements.visual;

        visual.replaceChildren();

        visual.style.display = "flex";
        visual.style.justifyContent = "center";
        visual.style.alignItems = "center";
        visual.style.gap = "18px";
        visual.style.flexWrap = "wrap";
        visual.style.marginBottom = "24px";

        for (
            let part = 1;
            part <= problem.denominator;
            part++
        ) {

            const square = document.createElement("div");

            square.style.width = "56px";
            square.style.height = "56px";
            square.style.borderRadius = "12px";
            square.style.border = "4px solid #4b4b4b";
            square.style.boxSizing = "border-box";

            if (part <= problem.numerator) {

                square.style.background = "#7b3f00";

            } else {

                square.style.background = "transparent";

            }

            visual.appendChild(square);

        }

        elements.question.textContent =
            problem.questionText;

        elements.example.textContent =
            problem.exampleText;

    },

    checkAnswer(context) {

        const problem = context.problem;

        const parsed =
            parseFraction(context.userAnswer);

        if (!parsed) {

            return {
                correct: false,
                message:
                    "Please enter your answer as a fraction (Example: 1/3)."
            };

        }

        const correct =
            fractionsAreEquivalent(
                parsed.numerator,
                parsed.denominator,
                problem.numerator,
                problem.denominator
            );

        if (!correct) {

            return {
                correct: false,
                message:
                    "Not quite. Count the shaded parts and then count all parts."
            };

        }

        const simplified =
            simplifyFraction(
                problem.numerator,
                problem.denominator
            );
        return {

            correct: true,

            simplifiedAnswer:
                formatFraction(
                    simplified.numerator,
                    simplified.denominator
                )

        };

    },

    formatCorrectFeedback(context) {

        return (
            "Correct. Simplified answer: " +
            context.result.simplifiedAnswer
        );

    },

    formatIncorrectFeedback() {

        return (
            "Not quite. Count the shaded parts and then count all parts."
        );

    }

});




// ==================================================
// GENERATOR 02: Numerator or denominator
// ==================================================

registerFractionGenerator(2, {
    title: "Numerator or denominator",

    createProblem() {
        const denominator = randomInteger(2, 20);
        const numerator = randomInteger(1, denominator - 1);

        const questionType = randomItem([
            "numerator",
            "denominator"
        ]);

        return {
            numerator,
            denominator,
            questionType,
            questionText:
                questionType === "numerator"
                    ? "What is the numerator?"
                    : "What is the denominator?",
            exampleText:
                questionType === "numerator"
                    ? "The numerator is the top number."
                    : "The denominator is the bottom number."
        };
    },

    renderProblem(context) {
        const problem = context.problem;
        const elements = context.elements;

        elements.visual.replaceChildren();

        elements.visual.style.display = "flex";
        elements.visual.style.flexDirection = "column";
        elements.visual.style.alignItems = "center";
        elements.visual.style.justifyContent = "center";
        elements.visual.style.marginBottom = "24px";

        const fractionDisplay = document.createElement("div");

        fractionDisplay.style.display = "inline-flex";
        fractionDisplay.style.flexDirection = "column";
        fractionDisplay.style.alignItems = "center";
        fractionDisplay.style.justifyContent = "center";
        fractionDisplay.style.fontSize = "48px";
        fractionDisplay.style.fontWeight = "700";
        fractionDisplay.style.lineHeight = "1.1";
        fractionDisplay.style.minWidth = "90px";

        const numeratorElement = document.createElement("div");
        numeratorElement.textContent = problem.numerator;

        const fractionLine = document.createElement("div");
        fractionLine.style.width = "100%";
        fractionLine.style.height = "4px";
        fractionLine.style.background = "currentColor";
        fractionLine.style.margin = "6px 0";

        const denominatorElement = document.createElement("div");
        denominatorElement.textContent = problem.denominator;

        fractionDisplay.appendChild(numeratorElement);
        fractionDisplay.appendChild(fractionLine);
        fractionDisplay.appendChild(denominatorElement);

        elements.visual.appendChild(fractionDisplay);

        elements.question.textContent = problem.questionText;
        elements.example.textContent = problem.exampleText;
    },

    checkAnswer(context) {
        const problem = context.problem;
        const normalizedAnswer = context.userAnswer.trim();

        if (!/^[+-]?\d+$/.test(normalizedAnswer)) {
            return {
                correct: false,
                message: "Please enter a whole number."
            };
        }

        const userNumber = Number(normalizedAnswer);

        const expectedAnswer =
            problem.questionType === "numerator"
                ? problem.numerator
                : problem.denominator;

        if (userNumber === expectedAnswer) {
            return {
                correct: true,
                expectedAnswer: String(expectedAnswer)
            };
        }

        if (problem.questionType === "numerator") {
            return {
                correct: false,
                message:
                    "Not quite. The numerator is the top number."
            };
        }

        return {
            correct: false,
            message:
                "Not quite. The denominator is the bottom number."
        };
    },

    formatCorrectFeedback(context) {
        return (
            "Correct. Answer: " +
            context.result.expectedAnswer
        );
    },

    formatIncorrectFeedback(context) {
        if (context.problem.questionType === "numerator") {
            return "Not quite. The numerator is the top number.";
        }

        return "Not quite. The denominator is the bottom number.";
    }
});



// ==================================================
// GENERATOR 03: Equivalent fractions
// ==================================================

registerFractionGenerator(3, {
    title: "Equivalent fractions",

    createProblem() {
        const denominator = randomInteger(2, 12);
        const numerator = randomInteger(1, denominator - 1);
        const multiplier = randomInteger(2, 6);

        const missingPart = randomItem([
            "numerator",
            "denominator"
        ]);

        const equivalentNumerator =
            numerator * multiplier;

        const equivalentDenominator =
            denominator * multiplier;

        return {
            numerator,
            denominator,
            multiplier,
            equivalentNumerator,
            equivalentDenominator,
            missingPart
        };
    },

    renderProblem(context) {
        const problem = context.problem;
        const elements = context.elements;

        elements.visual.replaceChildren();

        elements.visual.style.display = "flex";
        elements.visual.style.alignItems = "center";
        elements.visual.style.justifyContent = "center";
        elements.visual.style.gap = "22px";
        elements.visual.style.flexWrap = "wrap";
        elements.visual.style.marginBottom = "24px";
        elements.visual.style.fontSize = "42px";
        elements.visual.style.fontWeight = "700";

        const firstFraction = document.createElement("div");
        firstFraction.style.display = "inline-flex";
        firstFraction.style.flexDirection = "column";
        firstFraction.style.alignItems = "center";
        firstFraction.style.minWidth = "80px";

        const firstNumerator = document.createElement("div");
        firstNumerator.textContent = problem.numerator;

        const firstLine = document.createElement("div");
        firstLine.style.width = "100%";
        firstLine.style.height = "4px";
        firstLine.style.background = "currentColor";
        firstLine.style.margin = "5px 0";

        const firstDenominator = document.createElement("div");
        firstDenominator.textContent = problem.denominator;

        firstFraction.appendChild(firstNumerator);
        firstFraction.appendChild(firstLine);
        firstFraction.appendChild(firstDenominator);

        const equalsSign = document.createElement("div");
        equalsSign.textContent = "=";

        const secondFraction = document.createElement("div");
        secondFraction.style.display = "inline-flex";
        secondFraction.style.flexDirection = "column";
        secondFraction.style.alignItems = "center";
        secondFraction.style.minWidth = "80px";

        const secondNumerator = document.createElement("div");

        secondNumerator.textContent =
            problem.missingPart === "numerator"
                ? "?"
                : problem.equivalentNumerator;

        const secondLine = document.createElement("div");
        secondLine.style.width = "100%";
        secondLine.style.height = "4px";
        secondLine.style.background = "currentColor";
        secondLine.style.margin = "5px 0";

        const secondDenominator = document.createElement("div");

        secondDenominator.textContent =
            problem.missingPart === "denominator"
                ? "?"
                : problem.equivalentDenominator;

        secondFraction.appendChild(secondNumerator);
        secondFraction.appendChild(secondLine);
        secondFraction.appendChild(secondDenominator);

        elements.visual.appendChild(firstFraction);
        elements.visual.appendChild(equalsSign);
        elements.visual.appendChild(secondFraction);

        elements.question.textContent =
            "Which number makes the fractions equivalent?";

        elements.example.textContent =
            "Multiply the numerator and denominator by the same number.";
    },

    checkAnswer(context) {
        const problem = context.problem;
        const normalizedAnswer = context.userAnswer.trim();

        if (!/^[+-]?\d+$/.test(normalizedAnswer)) {
            return {
                correct: false,
                message: "Please enter a whole number."
            };
        }

        const userNumber = Number(normalizedAnswer);

        const expectedAnswer =
            problem.missingPart === "numerator"
                ? problem.equivalentNumerator
                : problem.equivalentDenominator;

        if (userNumber === expectedAnswer) {
            return {
                correct: true,
                expectedAnswer: String(expectedAnswer)
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Multiply the numerator and denominator by the same number."
        };
    },

    formatCorrectFeedback(context) {
        return (
            "Correct. Answer: " +
            context.result.expectedAnswer
        );
    },

    formatIncorrectFeedback() {
        return (
            "Not quite. Multiply the numerator and denominator by the same number."
        );
    }
});




// ==================================================
// GENERATOR 04: Simplify a fraction
// ==================================================

registerFractionGenerator(4, {
    title: "Simplify a fraction",

    createProblem() {
        const commonFactor = randomInteger(2, 8);

        const simplifiedDenominator = randomInteger(2, 12);
        const simplifiedNumerator = randomInteger(
            1,
            simplifiedDenominator - 1
        );

        const gcdValue = greatestCommonDivisor(
            simplifiedNumerator,
            simplifiedDenominator
        );

        const numerator =
            (simplifiedNumerator / gcdValue) *
            commonFactor;

        const denominator =
            (simplifiedDenominator / gcdValue) *
            commonFactor;

        const simplified =
            simplifyFraction(
                numerator,
                denominator
            );

        return {
            numerator,
            denominator,
            simplifiedNumerator:
                simplified.numerator,
            simplifiedDenominator:
                simplified.denominator
        };
    },

    renderProblem(context) {
        const problem = context.problem;
        const elements = context.elements;

        elements.visual.replaceChildren();

        elements.visual.style.display = "flex";
        elements.visual.style.justifyContent =
            "center";
        elements.visual.style.alignItems =
            "center";
        elements.visual.style.marginBottom =
            "24px";

        const fraction = document.createElement(
            "div"
        );

        fraction.style.display = "inline-flex";
        fraction.style.flexDirection = "column";
        fraction.style.alignItems = "center";
        fraction.style.fontSize = "48px";
        fraction.style.fontWeight = "700";
        fraction.style.lineHeight = "1.1";
        fraction.style.minWidth = "90px";

        const numerator =
            document.createElement("div");
        numerator.textContent =
            problem.numerator;

        const line =
            document.createElement("div");
        line.style.width = "100%";
        line.style.height = "4px";
        line.style.background =
            "currentColor";
        line.style.margin = "6px 0";

        const denominator =
            document.createElement("div");
        denominator.textContent =
            problem.denominator;

        fraction.appendChild(numerator);
        fraction.appendChild(line);
        fraction.appendChild(denominator);

        elements.visual.appendChild(fraction);

        elements.question.textContent =
            "Simplify the fraction.";

        elements.example.textContent =
            "Example: 6/8 → 3/4";
    },

    checkAnswer(context) {
        const problem = context.problem;

        const answer =
            normalizeFractionAnswer(
                context.userAnswer
            );

        if (!answer) {
            return {
                correct: false,
                message:
                    "Please enter a fraction such as 3/4."
            };
        }

        if (
            answer.numerator ===
                problem.simplifiedNumerator &&
            answer.denominator ===
                problem.simplifiedDenominator
        ) {
            return {
                correct: true,
                expectedAnswer:
                    problem.simplifiedNumerator +
                    "/" +
                    problem.simplifiedDenominator
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Divide the numerator and denominator by their greatest common factor."
        };
    },

    formatCorrectFeedback(context) {
        return (
            "Correct. Simplified answer: " +
            context.result.expectedAnswer
        );
    },

    formatIncorrectFeedback() {
        return (
            "Not quite. Divide the numerator and denominator by their greatest common factor."
        );
    }
});




// ==================================================
// GENERATOR 05: Compare — same denominator
// ==================================================

// CODE FÜR GENERATOR 05 HIER EINFÜGEN




// ==================================================
// GENERATOR 06: Compare — same numerator
// ==================================================

// CODE FÜR GENERATOR 06 HIER EINFÜGEN




// ==================================================
// GENERATOR 07: Compare — different fractions
// ==================================================

// CODE FÜR GENERATOR 07 HIER EINFÜGEN




// ==================================================
// GENERATOR 08: Order three fractions
// ==================================================

// CODE FÜR GENERATOR 08 HIER EINFÜGEN




// ==================================================
// GENERATOR 09: Add — same denominator
// ==================================================

// CODE FÜR GENERATOR 09 HIER EINFÜGEN




// ==================================================
// GENERATOR 10: Subtract — same denominator
// ==================================================

// CODE FÜR GENERATOR 10 HIER EINFÜGEN




// ==================================================
// GENERATOR 11: Add — different denominators
// ==================================================

// CODE FÜR GENERATOR 11 HIER EINFÜGEN




// ==================================================
// GENERATOR 12: Subtract — different denominators
// ==================================================

// CODE FÜR GENERATOR 12 HIER EINFÜGEN




// ==================================================
// GENERATOR 13: Add three fractions
// ==================================================

// CODE FÜR GENERATOR 13 HIER EINFÜGEN




// ==================================================
// GENERATOR 14: Whole number × fraction
// ==================================================

// CODE FÜR GENERATOR 14 HIER EINFÜGEN




// ==================================================
// GENERATOR 15: Multiply two fractions
// ==================================================

// CODE FÜR GENERATOR 15 HIER EINFÜGEN




// ==================================================
// GENERATOR 16: Fraction ÷ whole number
// ==================================================

// CODE FÜR GENERATOR 16 HIER EINFÜGEN




// ==================================================
// GENERATOR 17: Divide two fractions
// ==================================================

// CODE FÜR GENERATOR 17 HIER EINFÜGEN




// ==================================================
// GENERATOR 18: Improper fraction → mixed number
// ==================================================

// CODE FÜR GENERATOR 18 HIER EINFÜGEN




// ==================================================
// GENERATOR 19: Mixed number → improper fraction
// ==================================================

// CODE FÜR GENERATOR 19 HIER EINFÜGEN




// ==================================================
// GENERATOR 20: Fraction of a quantity
// ==================================================

// CODE FÜR GENERATOR 20 HIER EINFÜGEN




// ==================================================
// MIXED PRACTICE
//
// Mixed Practice ist kein zusätzlicher Generator.
// Es wählt zufällig einen der bereits aktiven
// Generatoren 01 bis 20 aus.
// ==================================================
