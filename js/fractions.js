"use strict";

// ==================================================
// THE MATH FINAL GIRL
// FRACTIONS MASTER FILE
//
// GitHub-Zwischendatei: fractionsjs.html
// Später umbenennen in: fractions.js
//
// Diese Datei enthält ausschließlich JavaScript.
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

    fractionGenerators.set(number, {
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
// 05. HTML-ELEMENTE
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
    document
        .querySelectorAll(FRACTIONS_CONFIG.generatorButtonSelector)
        .forEach((button) => {
            button.addEventListener("click", handleGeneratorButtonClick);
        });
}


function connectMixedPracticeButton() {
    const button = document.querySelector(
        FRACTIONS_CONFIG.mixedPracticeButtonSelector
    );

    if (button) {
        button.addEventListener("click", startMixedPractice);
    }
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
        event.currentTarget.dataset.fractionGenerator
    );

    if (fractionGenerators.has(generatorNumber)) {
        startFractionGenerator(generatorNumber);
    }
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
    document
        .querySelectorAll(FRACTIONS_CONFIG.generatorButtonSelector)
        .forEach((button) => {
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


function markMixedPracticeButtonActive() {
    document
        .querySelectorAll(FRACTIONS_CONFIG.generatorButtonSelector)
        .forEach((button) => {
            button.classList.remove(FRACTIONS_CONFIG.activeButtonClass);
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


function deactivateUnavailableGeneratorButtons() {
    document
        .querySelectorAll(FRACTIONS_CONFIG.generatorButtonSelector)
        .forEach((button) => {
            const generatorNumber = Number(
                button.dataset.fractionGenerator
            );

            const isAvailable = fractionGenerators.has(generatorNumber);

            button.disabled = !isAvailable;
            button.setAttribute("aria-disabled", String(!isAvailable));
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


function chooseRandomActiveGeneratorNumber() {
    if (fractionsState.activeGeneratorNumbers.length === 0) {
        return null;
    }

    return randomItem(fractionsState.activeGeneratorNumbers);
}


// ==================================================
// 09. AUFGABE ERSTELLEN
// ==================================================

function createNextProblem() {
    clearFeedback();
    clearAnswerField();

    fractionsState.answerChecked = false;

    let generatorNumber = fractionsState.activeGeneratorNumber;

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

    try {
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
    } catch (error) {
        console.error(error);
        showIncorrectFeedback(
            "This exercise could not create a problem. Please choose another exercise."
        );
    }
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
    exerciseArea.classList.remove(FRACTIONS_CONFIG.hiddenClass);

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

    let result;

    try {
        result = generator.checkAnswer({
            userAnswer,
            problem: currentProblem.data,
            helpers: fractionHelperFunctions
        });
    } catch (error) {
        console.error(error);
        showIncorrectFeedback(
            "This exercise could not check the answer. Please try a new problem."
        );
        return;
    }

    const normalizedResult = normalizeCheckResult(result);

    fractionsState.answerChecked = true;

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
// 12. FEEDBACK
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
// 14. MATHEMATISCHE HILFSFUNKTIONEN
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
    const simplified = simplifyFraction(numerator, denominator);

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

    const originalNumerator = Number(match[1]);
    const originalDenominator = Number(match[2]);

    if (
        !Number.isInteger(originalNumerator) ||
        !Number.isInteger(originalDenominator) ||
        originalDenominator === 0
    ) {
        return null;
    }

    const simplified = simplifyFraction(
        originalNumerator,
        originalDenominator
    );

    return {
        originalNumerator,
        originalDenominator,
        numerator: simplified.numerator,
        denominator: simplified.denominator
    };
}


function parseMixedNumber(value) {
    if (typeof value !== "string") {
        return null;
    }

    const normalizedValue = value.trim().replace(/\s+/g, " ");
    const match = normalizedValue.match(
        /^([+-]?\d+)\s+(\d+)\/(\d+)$/
    );

    if (!match) {
        return null;
    }

    const wholeNumber = Number(match[1]);
    const numerator = Number(match[2]);
    const denominator = Number(match[3]);

    if (
        !Number.isInteger(wholeNumber) ||
        !Number.isInteger(numerator) ||
        !Number.isInteger(denominator) ||
        numerator < 0 ||
        denominator <= 0 ||
        numerator >= denominator
    ) {
        return null;
    }

    return {
        wholeNumber,
        numerator,
        denominator
    };
}


function formatMixedNumber(wholeNumber, numerator, denominator) {
    if (numerator === 0) {
        return String(wholeNumber);
    }

    return `${wholeNumber} ${formatFraction(numerator, denominator)}`;
}


function fractionsAreEquivalent(
    firstNumerator,
    firstDenominator,
    secondNumerator,
    secondDenominator
) {
    if (
        firstDenominator === 0 ||
        secondDenominator === 0
    ) {
        return false;
    }

    return (
        Number(firstNumerator) * Number(secondDenominator) ===
        Number(secondNumerator) * Number(firstDenominator)
    );
}


function compareFractions(
    firstNumerator,
    firstDenominator,
    secondNumerator,
    secondDenominator
) {
    const firstValue =
        Number(firstNumerator) * Number(secondDenominator);

    const secondValue =
        Number(secondNumerator) * Number(firstDenominator);

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
    return simplifyFraction(
        firstNumerator * secondDenominator +
            secondNumerator * firstDenominator,
        firstDenominator * secondDenominator
    );
}


function subtractFractions(
    firstNumerator,
    firstDenominator,
    secondNumerator,
    secondDenominator
) {
    return simplifyFraction(
        firstNumerator * secondDenominator -
            secondNumerator * firstDenominator,
        firstDenominator * secondDenominator
    );
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


function improperFractionToMixedNumber(numerator, denominator) {
    const simplified = simplifyFraction(numerator, denominator);

    if (!simplified) {
        return null;
    }

    const wholeNumber = Math.trunc(
        simplified.numerator / simplified.denominator
    );

    const remainder = Math.abs(
        simplified.numerator % simplified.denominator
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

    return simplifyFraction(
        whole * bottom + sign * Math.abs(top),
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

    return items[randomInteger(0, items.length - 1)];
}


function shuffleArray(items) {
    const shuffledItems = [...items];

    for (
        let currentIndex = shuffledItems.length - 1;
        currentIndex > 0;
        currentIndex -= 1
    ) {
        const randomIndex = randomInteger(0, currentIndex);

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


function normalizeTextAnswer(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


function normalizeComparisonSymbol(value) {
    const normalizedValue = String(value)
        .trim()
        .toLowerCase()
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
// 16. GEMEINSAMES RENDERING
// ==================================================

function createFractionElement(numerator, denominator, options = {}) {
    const fraction = document.createElement("div");

    fraction.style.display = "inline-flex";
    fraction.style.flexDirection = "column";
    fraction.style.alignItems = "center";
    fraction.style.justifyContent = "center";
    fraction.style.fontSize = options.fontSize || "42px";
    fraction.style.fontWeight = "700";
    fraction.style.lineHeight = "1.1";
    fraction.style.minWidth = options.minWidth || "80px";

    const top = document.createElement("div");
    top.textContent = numerator;

    const line = document.createElement("div");
    line.style.width = "100%";
    line.style.height = "4px";
    line.style.background = "currentColor";
    line.style.margin = "6px 0";

    const bottom = document.createElement("div");
    bottom.textContent = denominator;

    fraction.appendChild(top);
    fraction.appendChild(line);
    fraction.appendChild(bottom);

    return fraction;
}


function renderFractionExpression(
    visualElement,
    fractions,
    symbols = []
) {
    visualElement.replaceChildren();
    visualElement.style.display = "flex";
    visualElement.style.justifyContent = "center";
    visualElement.style.alignItems = "center";
    visualElement.style.gap = "22px";
    visualElement.style.flexWrap = "wrap";
    visualElement.style.marginBottom = "24px";

    fractions.forEach((fraction, index) => {
        visualElement.appendChild(
            createFractionElement(
                fraction.numerator,
                fraction.denominator
            )
        );

        if (index < symbols.length) {
            const symbol = document.createElement("div");
            symbol.textContent = symbols[index];
            symbol.style.fontSize = "42px";
            symbol.style.fontWeight = "700";
            visualElement.appendChild(symbol);
        }
    });
}


function renderPlainExpression(visualElement, expression) {
    visualElement.replaceChildren();
    visualElement.style.display = "flex";
    visualElement.style.justifyContent = "center";
    visualElement.style.alignItems = "center";
    visualElement.style.marginBottom = "24px";
    visualElement.style.fontSize = "42px";
    visualElement.style.fontWeight = "700";
    visualElement.textContent = expression;
}


function checkFractionEquivalentToExpected(
    userAnswer,
    expectedNumerator,
    expectedDenominator
) {
    const parsed = parseFraction(userAnswer);

    if (!parsed) {
        return null;
    }

    return fractionsAreEquivalent(
        parsed.originalNumerator,
        parsed.originalDenominator,
        expectedNumerator,
        expectedDenominator
    );
}


// ==================================================
// 17. HILFSFUNKTIONEN FÜR GENERATOREN
// ==================================================

const fractionHelperFunctions = Object.freeze({
    greatestCommonDivisor,
    leastCommonMultiple,
    simplifyFraction,
    formatFraction,
    formatUnsimplifiedFraction,
    parseFraction,
    parseMixedNumber,
    formatMixedNumber,
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
    normalizeTextAnswer,
    normalizeComparisonSymbol,
    createFractionElement,
    renderFractionExpression,
    renderPlainExpression,
    checkFractionEquivalentToExpected,
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
        const possibleDenominators = [2, 3, 4, 5, 6, 8, 10, 12];
        const denominator = randomItem(possibleDenominators);
        const numerator = randomInteger(1, denominator - 1);

        return {
            numerator,
            denominator
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;
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
            part += 1
        ) {
            const square = document.createElement("div");

            square.style.width = "56px";
            square.style.height = "56px";
            square.style.borderRadius = "12px";
            square.style.border = "4px solid #4b4b4b";
            square.style.boxSizing = "border-box";
            square.style.background =
                part <= problem.numerator
                    ? "#7b3f00"
                    : "transparent";

            visual.appendChild(square);
        }

        elements.question.textContent =
            "What fraction is shaded?";

        elements.example.textContent =
            "Example: 1/3";
    },

    checkAnswer(context) {
        const parsed = parseFraction(context.userAnswer);

        if (!parsed) {
            return {
                correct: false,
                message:
                    "Please enter your answer as a fraction, for example 1/3."
            };
        }

        const correct = fractionsAreEquivalent(
            parsed.originalNumerator,
            parsed.originalDenominator,
            context.problem.numerator,
            context.problem.denominator
        );

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Count the shaded parts and then count all parts."
            };
        }

        return {
            correct: true,
            simplifiedAnswer: formatFraction(
                context.problem.numerator,
                context.problem.denominator
            )
        };
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
            questionType
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [{
                numerator: problem.numerator,
                denominator: problem.denominator
            }]
        );

        elements.question.textContent =
            problem.questionType === "numerator"
                ? "What is the numerator?"
                : "What is the denominator?";

        elements.example.textContent =
            problem.questionType === "numerator"
                ? "The numerator is the top number."
                : "The denominator is the bottom number.";
    },

    checkAnswer(context) {
        const normalizedAnswer = context.userAnswer.trim();

        if (!/^[+-]?\d+$/.test(normalizedAnswer)) {
            return {
                correct: false,
                message: "Please enter a whole number."
            };
        }

        const expectedAnswer =
            context.problem.questionType === "numerator"
                ? context.problem.numerator
                : context.problem.denominator;

        if (Number(normalizedAnswer) === expectedAnswer) {
            return {
                correct: true,
                expectedAnswer: String(expectedAnswer)
            };
        }

        return {
            correct: false,
            message:
                context.problem.questionType === "numerator"
                    ? "Not quite. The numerator is the top number."
                    : "Not quite. The denominator is the bottom number."
        };
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

        return {
            numerator,
            denominator,
            equivalentNumerator: numerator * multiplier,
            equivalentDenominator: denominator * multiplier,
            missingPart
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [
                {
                    numerator: problem.numerator,
                    denominator: problem.denominator
                },
                {
                    numerator:
                        problem.missingPart === "numerator"
                            ? "?"
                            : problem.equivalentNumerator,
                    denominator:
                        problem.missingPart === "denominator"
                            ? "?"
                            : problem.equivalentDenominator
                }
            ],
            ["="]
        );

        elements.question.textContent =
            "Which number makes the fractions equivalent?";

        elements.example.textContent =
            "Multiply the numerator and denominator by the same number.";
    },

    checkAnswer(context) {
        const normalizedAnswer = context.userAnswer.trim();

        if (!/^[+-]?\d+$/.test(normalizedAnswer)) {
            return {
                correct: false,
                message: "Please enter a whole number."
            };
        }

        const expectedAnswer =
            context.problem.missingPart === "numerator"
                ? context.problem.equivalentNumerator
                : context.problem.equivalentDenominator;

        if (Number(normalizedAnswer) === expectedAnswer) {
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
    }
});


// ==================================================
// GENERATOR 04: Simplify a fraction
// ==================================================

registerFractionGenerator(4, {
    title: "Simplify a fraction",

    createProblem() {
        const baseDenominator = randomInteger(2, 12);
        let baseNumerator = randomInteger(
            1,
            baseDenominator - 1
        );

        while (
            greatestCommonDivisor(
                baseNumerator,
                baseDenominator
            ) !== 1
        ) {
            baseNumerator = randomInteger(
                1,
                baseDenominator - 1
            );
        }

        const commonFactor = randomInteger(2, 8);

        return {
            numerator: baseNumerator * commonFactor,
            denominator: baseDenominator * commonFactor,
            simplifiedNumerator: baseNumerator,
            simplifiedDenominator: baseDenominator
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [{
                numerator: problem.numerator,
                denominator: problem.denominator
            }]
        );

        elements.question.textContent =
            "Simplify the fraction.";

        elements.example.textContent =
            "Example: 6/8 → 3/4";
    },

    checkAnswer(context) {
        const parsed = parseFraction(context.userAnswer);

        if (!parsed) {
            return {
                correct: false,
                message:
                    "Please enter a fraction such as 3/4."
            };
        }

        const correct = fractionsAreEquivalent(
            parsed.originalNumerator,
            parsed.originalDenominator,
            context.problem.simplifiedNumerator,
            context.problem.simplifiedDenominator
        );

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Divide the numerator and denominator by their greatest common factor."
            };
        }

        return {
            correct: true,
            simplifiedAnswer: formatFraction(
                context.problem.simplifiedNumerator,
                context.problem.simplifiedDenominator
            )
        };
    }
});


// ==================================================
// GENERATOR 05: Compare — same denominator
// ==================================================

registerFractionGenerator(5, {
    title: "Compare: same denominator",

    createProblem() {
        const denominator = randomInteger(3, 15);
        let numerator1 = randomInteger(1, denominator - 1);
        let numerator2 = randomInteger(1, denominator - 1);

        while (numerator2 === numerator1) {
            numerator2 = randomInteger(1, denominator - 1);
        }

        return {
            numerator1,
            denominator1: denominator,
            numerator2,
            denominator2: denominator,
            correctSymbol:
                numerator1 > numerator2 ? ">" : "<"
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [
                {
                    numerator: problem.numerator1,
                    denominator: problem.denominator1
                },
                {
                    numerator: problem.numerator2,
                    denominator: problem.denominator2
                }
            ],
            ["?"]
        );

        elements.question.textContent =
            "Compare the two fractions. Enter < or >.";

        elements.example.textContent =
            "With the same denominator, compare the numerators.";
    },

    checkAnswer(context) {
        const answer = normalizeComparisonSymbol(
            context.userAnswer
        );

        if (!answer || answer === "=") {
            return {
                correct: false,
                message: "Please enter < or >."
            };
        }

        if (answer === context.problem.correctSymbol) {
            return {
                correct: true,
                expectedAnswer:
                    context.problem.correctSymbol
            };
        }

        return {
            correct: false,
            message:
                "Not quite. With the same denominator, the larger numerator gives the larger fraction."
        };
    }
});


// ==================================================
// GENERATOR 06: Compare — same numerator
// ==================================================

registerFractionGenerator(6, {
    title: "Compare: same numerator",

    createProblem() {
        const numerator = randomInteger(1, 12);
        let denominator1 = randomInteger(
            numerator + 1,
            20
        );
        let denominator2 = randomInteger(
            numerator + 1,
            20
        );

        while (denominator2 === denominator1) {
            denominator2 = randomInteger(
                numerator + 1,
                20
            );
        }

        return {
            numerator1: numerator,
            denominator1,
            numerator2: numerator,
            denominator2,
            correctSymbol:
                denominator1 < denominator2 ? ">" : "<"
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [
                {
                    numerator: problem.numerator1,
                    denominator: problem.denominator1
                },
                {
                    numerator: problem.numerator2,
                    denominator: problem.denominator2
                }
            ],
            ["?"]
        );

        elements.question.textContent =
            "Compare the two fractions. Enter < or >.";

        elements.example.textContent =
            "With the same numerator, the smaller denominator gives the larger fraction.";
    },

    checkAnswer(context) {
        const answer = normalizeComparisonSymbol(
            context.userAnswer
        );

        if (!answer || answer === "=") {
            return {
                correct: false,
                message: "Please enter < or >."
            };
        }

        if (answer === context.problem.correctSymbol) {
            return {
                correct: true,
                expectedAnswer:
                    context.problem.correctSymbol
            };
        }

        return {
            correct: false,
            message:
                "Not quite. With the same numerator, the smaller denominator gives the larger fraction."
        };
    }
});


// ==================================================
// GENERATOR 07: Compare — different fractions
// ==================================================

registerFractionGenerator(7, {
    title: "Compare: different fractions",

    createProblem() {
        let numerator1;
        let denominator1;
        let numerator2;
        let denominator2;
        let comparison;

        do {
            denominator1 = randomInteger(2, 15);
            denominator2 = randomInteger(2, 15);
            numerator1 = randomInteger(1, denominator1 - 1);
            numerator2 = randomInteger(1, denominator2 - 1);

            comparison = compareFractions(
                numerator1,
                denominator1,
                numerator2,
                denominator2
            );
        } while (comparison === 0);

        return {
            numerator1,
            denominator1,
            numerator2,
            denominator2,
            correctSymbol:
                comparison > 0 ? ">" : "<"
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [
                {
                    numerator: problem.numerator1,
                    denominator: problem.denominator1
                },
                {
                    numerator: problem.numerator2,
                    denominator: problem.denominator2
                }
            ],
            ["?"]
        );

        elements.question.textContent =
            "Compare the two fractions. Enter < or >.";

        elements.example.textContent =
            "Use a common denominator or cross multiplication.";
    },

    checkAnswer(context) {
        const answer = normalizeComparisonSymbol(
            context.userAnswer
        );

        if (!answer || answer === "=") {
            return {
                correct: false,
                message: "Please enter < or >."
            };
        }

        if (answer === context.problem.correctSymbol) {
            return {
                correct: true,
                expectedAnswer:
                    context.problem.correctSymbol
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Use a common denominator or cross multiplication."
        };
    }
});


// ==================================================
// GENERATOR 08: Order three fractions
// ==================================================

registerFractionGenerator(8, {
    title: "Order three fractions",

    createProblem() {
        const fractions = [];

        while (fractions.length < 3) {
            const denominator = randomInteger(2, 12);
            const numerator = randomInteger(
                1,
                denominator - 1
            );

            const duplicate = fractions.some((fraction) => {
                return fractionsAreEquivalent(
                    fraction.numerator,
                    fraction.denominator,
                    numerator,
                    denominator
                );
            });

            if (!duplicate) {
                fractions.push({
                    numerator,
                    denominator
                });
            }
        }

        const ordered = [...fractions].sort(
            (first, second) => {
                return compareFractions(
                    first.numerator,
                    first.denominator,
                    second.numerator,
                    second.denominator
                );
            }
        );

        return {
            fractions,
            ordered
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            problem.fractions,
            [",", ","]
        );

        elements.question.textContent =
            "Order the fractions from smallest to largest.";

        elements.example.textContent =
            "Enter them separated by commas, for example: 1/4, 1/2, 3/4";
    },

    checkAnswer(context) {
        const parts = context.userAnswer
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);

        if (parts.length !== 3) {
            return {
                correct: false,
                message:
                    "Please enter three fractions separated by commas."
            };
        }

        const parsed = parts.map(parseFraction);

        if (parsed.some((fraction) => !fraction)) {
            return {
                correct: false,
                message:
                    "Please enter three valid fractions separated by commas."
            };
        }

        const correct = parsed.every(
            (fraction, index) => {
                const expected =
                    context.problem.ordered[index];

                return fractionsAreEquivalent(
                    fraction.originalNumerator,
                    fraction.originalDenominator,
                    expected.numerator,
                    expected.denominator
                );
            }
        );

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Compare the values and place the smallest fraction first."
            };
        }

        return {
            correct: true,
            expectedAnswer:
                context.problem.ordered
                    .map((fraction) => {
                        return formatFraction(
                            fraction.numerator,
                            fraction.denominator
                        );
                    })
                    .join(", ")
        };
    }
});


// ==================================================
// GENERATOR 09: Add — same denominator
// ==================================================

registerFractionGenerator(9, {
    title: "Add: same denominator",

    createProblem() {
        const denominator = randomInteger(3, 15);
        const numerator1 = randomInteger(
            1,
            denominator - 1
        );
        const numerator2 = randomInteger(
            1,
            denominator - 1
        );
        const result = addFractions(
            numerator1,
            denominator,
            numerator2,
            denominator
        );

        return {
            numerator1,
            numerator2,
            denominator,
            result
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [
                {
                    numerator: problem.numerator1,
                    denominator: problem.denominator
                },
                {
                    numerator: problem.numerator2,
                    denominator: problem.denominator
                }
            ],
            ["+"]
        );

        elements.question.textContent =
            "Add the fractions and simplify the answer.";

        elements.example.textContent =
            "Keep the denominator and add the numerators.";
    },

    checkAnswer(context) {
        const correct = checkFractionEquivalentToExpected(
            context.userAnswer,
            context.problem.result.numerator,
            context.problem.result.denominator
        );

        if (correct === null) {
            return {
                correct: false,
                message:
                    "Please enter a fraction such as 5/8."
            };
        }

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Keep the denominator and add the numerators."
            };
        }

        return {
            correct: true,
            simplifiedAnswer: formatFraction(
                context.problem.result.numerator,
                context.problem.result.denominator
            )
        };
    }
});


// ==================================================
// GENERATOR 10: Subtract — same denominator
// ==================================================

registerFractionGenerator(10, {
    title: "Subtract: same denominator",

    createProblem() {
        const denominator = randomInteger(3, 15);
        const numerator1 = randomInteger(
            2,
            denominator - 1
        );
        const numerator2 = randomInteger(
            1,
            numerator1 - 1
        );
        const result = subtractFractions(
            numerator1,
            denominator,
            numerator2,
            denominator
        );

        return {
            numerator1,
            numerator2,
            denominator,
            result
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [
                {
                    numerator: problem.numerator1,
                    denominator: problem.denominator
                },
                {
                    numerator: problem.numerator2,
                    denominator: problem.denominator
                }
            ],
            ["−"]
        );

        elements.question.textContent =
            "Subtract the fractions and simplify the answer.";

        elements.example.textContent =
            "Keep the denominator and subtract the numerators.";
    },

    checkAnswer(context) {
        const correct = checkFractionEquivalentToExpected(
            context.userAnswer,
            context.problem.result.numerator,
            context.problem.result.denominator
        );

        if (correct === null) {
            return {
                correct: false,
                message:
                    "Please enter a fraction such as 3/8."
            };
        }

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Keep the denominator and subtract the numerators."
            };
        }

        return {
            correct: true,
            simplifiedAnswer: formatFraction(
                context.problem.result.numerator,
                context.problem.result.denominator
            )
        };
    }
});


// ==================================================
// GENERATOR 11: Add — different denominators
// ==================================================

registerFractionGenerator(11, {
    title: "Add: different denominators",

    createProblem() {
        let denominator1 = randomInteger(2, 12);
        let denominator2 = randomInteger(2, 12);

        while (denominator2 === denominator1) {
            denominator2 = randomInteger(2, 12);
        }

        const numerator1 = randomInteger(
            1,
            denominator1 - 1
        );
        const numerator2 = randomInteger(
            1,
            denominator2 - 1
        );
        const result = addFractions(
            numerator1,
            denominator1,
            numerator2,
            denominator2
        );

        return {
            numerator1,
            denominator1,
            numerator2,
            denominator2,
            result
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [
                {
                    numerator: problem.numerator1,
                    denominator: problem.denominator1
                },
                {
                    numerator: problem.numerator2,
                    denominator: problem.denominator2
                }
            ],
            ["+"]
        );

        elements.question.textContent =
            "Add the fractions and simplify the answer.";

        elements.example.textContent =
            "Find a common denominator first.";
    },

    checkAnswer(context) {
        const correct = checkFractionEquivalentToExpected(
            context.userAnswer,
            context.problem.result.numerator,
            context.problem.result.denominator
        );

        if (correct === null) {
            return {
                correct: false,
                message:
                    "Please enter a fraction such as 7/12."
            };
        }

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Find a common denominator before adding."
            };
        }

        return {
            correct: true,
            simplifiedAnswer: formatFraction(
                context.problem.result.numerator,
                context.problem.result.denominator
            )
        };
    }
});


// ==================================================
// GENERATOR 12: Subtract — different denominators
// ==================================================

registerFractionGenerator(12, {
    title: "Subtract: different denominators",

    createProblem() {
        let numerator1;
        let denominator1;
        let numerator2;
        let denominator2;

        do {
            denominator1 = randomInteger(2, 12);
            denominator2 = randomInteger(2, 12);
            numerator1 = randomInteger(
                1,
                denominator1 - 1
            );
            numerator2 = randomInteger(
                1,
                denominator2 - 1
            );
        } while (
            denominator1 === denominator2 ||
            compareFractions(
                numerator1,
                denominator1,
                numerator2,
                denominator2
            ) <= 0
        );

        const result = subtractFractions(
            numerator1,
            denominator1,
            numerator2,
            denominator2
        );

        return {
            numerator1,
            denominator1,
            numerator2,
            denominator2,
            result
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [
                {
                    numerator: problem.numerator1,
                    denominator: problem.denominator1
                },
                {
                    numerator: problem.numerator2,
                    denominator: problem.denominator2
                }
            ],
            ["−"]
        );

        elements.question.textContent =
            "Subtract the fractions and simplify the answer.";

        elements.example.textContent =
            "Find a common denominator first.";
    },

    checkAnswer(context) {
        const correct = checkFractionEquivalentToExpected(
            context.userAnswer,
            context.problem.result.numerator,
            context.problem.result.denominator
        );

        if (correct === null) {
            return {
                correct: false,
                message:
                    "Please enter a fraction such as 5/12."
            };
        }

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Find a common denominator before subtracting."
            };
        }

        return {
            correct: true,
            simplifiedAnswer: formatFraction(
                context.problem.result.numerator,
                context.problem.result.denominator
            )
        };
    }
});


// ==================================================
// GENERATOR 13: Add three fractions
// ==================================================

registerFractionGenerator(13, {
    title: "Add three fractions",

    createProblem() {
        const fractions = [];

        for (let index = 0; index < 3; index += 1) {
            const denominator = randomInteger(2, 10);
            const numerator = randomInteger(
                1,
                denominator - 1
            );

            fractions.push({
                numerator,
                denominator
            });
        }

        const firstSum = addFractions(
            fractions[0].numerator,
            fractions[0].denominator,
            fractions[1].numerator,
            fractions[1].denominator
        );

        const result = addFractions(
            firstSum.numerator,
            firstSum.denominator,
            fractions[2].numerator,
            fractions[2].denominator
        );

        return {
            fractions,
            result
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            problem.fractions,
            ["+", "+"]
        );

        elements.question.textContent =
            "Add all three fractions and simplify the answer.";

        elements.example.textContent =
            "Use a common denominator.";
    },

    checkAnswer(context) {
        const correct = checkFractionEquivalentToExpected(
            context.userAnswer,
            context.problem.result.numerator,
            context.problem.result.denominator
        );

        if (correct === null) {
            return {
                correct: false,
                message:
                    "Please enter a fraction such as 11/12."
            };
        }

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Use a common denominator and add all three numerators."
            };
        }

        return {
            correct: true,
            simplifiedAnswer: formatFraction(
                context.problem.result.numerator,
                context.problem.result.denominator
            )
        };
    }
});


// ==================================================
// GENERATOR 14: Whole number × fraction
// ==================================================

registerFractionGenerator(14, {
    title: "Whole number × fraction",

    createProblem() {
        const wholeNumber = randomInteger(2, 12);
        const denominator = randomInteger(2, 12);
        const numerator = randomInteger(
            1,
            denominator - 1
        );
        const result = multiplyFractions(
            wholeNumber,
            1,
            numerator,
            denominator
        );

        return {
            wholeNumber,
            numerator,
            denominator,
            result
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        elements.visual.replaceChildren();
        elements.visual.style.display = "flex";
        elements.visual.style.justifyContent = "center";
        elements.visual.style.alignItems = "center";
        elements.visual.style.gap = "22px";
        elements.visual.style.marginBottom = "24px";

        const whole = document.createElement("div");
        whole.textContent = problem.wholeNumber;
        whole.style.fontSize = "42px";
        whole.style.fontWeight = "700";

        const multiplication = document.createElement("div");
        multiplication.textContent = "×";
        multiplication.style.fontSize = "42px";
        multiplication.style.fontWeight = "700";

        elements.visual.appendChild(whole);
        elements.visual.appendChild(multiplication);
        elements.visual.appendChild(
            createFractionElement(
                problem.numerator,
                problem.denominator
            )
        );

        elements.question.textContent =
            "Multiply and simplify the answer.";

        elements.example.textContent =
            "Write the whole number as a fraction over 1.";
    },

    checkAnswer(context) {
        const correct = checkFractionEquivalentToExpected(
            context.userAnswer,
            context.problem.result.numerator,
            context.problem.result.denominator
        );

        if (correct === null) {
            return {
                correct: false,
                message:
                    "Please enter a fraction such as 9/4."
            };
        }

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Multiply the whole number by the numerator."
            };
        }

        return {
            correct: true,
            simplifiedAnswer: formatFraction(
                context.problem.result.numerator,
                context.problem.result.denominator
            )
        };
    }
});


// ==================================================
// GENERATOR 15: Multiply two fractions
// ==================================================

registerFractionGenerator(15, {
    title: "Multiply two fractions",

    createProblem() {
        const denominator1 = randomInteger(2, 12);
        const denominator2 = randomInteger(2, 12);
        const numerator1 = randomInteger(
            1,
            denominator1 - 1
        );
        const numerator2 = randomInteger(
            1,
            denominator2 - 1
        );
        const result = multiplyFractions(
            numerator1,
            denominator1,
            numerator2,
            denominator2
        );

        return {
            numerator1,
            denominator1,
            numerator2,
            denominator2,
            result
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [
                {
                    numerator: problem.numerator1,
                    denominator: problem.denominator1
                },
                {
                    numerator: problem.numerator2,
                    denominator: problem.denominator2
                }
            ],
            ["×"]
        );

        elements.question.textContent =
            "Multiply the fractions and simplify the answer.";

        elements.example.textContent =
            "Multiply numerator by numerator and denominator by denominator.";
    },

    checkAnswer(context) {
        const correct = checkFractionEquivalentToExpected(
            context.userAnswer,
            context.problem.result.numerator,
            context.problem.result.denominator
        );

        if (correct === null) {
            return {
                correct: false,
                message:
                    "Please enter a fraction such as 3/8."
            };
        }

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Multiply the numerators and multiply the denominators."
            };
        }

        return {
            correct: true,
            simplifiedAnswer: formatFraction(
                context.problem.result.numerator,
                context.problem.result.denominator
            )
        };
    }
});


// ==================================================
// GENERATOR 16: Fraction ÷ whole number
// ==================================================

registerFractionGenerator(16, {
    title: "Fraction ÷ whole number",

    createProblem() {
        const denominator = randomInteger(2, 12);
        const numerator = randomInteger(
            1,
            denominator - 1
        );
        const wholeNumber = randomInteger(2, 10);
        const result = divideFractions(
            numerator,
            denominator,
            wholeNumber,
            1
        );

        return {
            numerator,
            denominator,
            wholeNumber,
            result
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        elements.visual.replaceChildren();
        elements.visual.style.display = "flex";
        elements.visual.style.justifyContent = "center";
        elements.visual.style.alignItems = "center";
        elements.visual.style.gap = "22px";
        elements.visual.style.marginBottom = "24px";

        elements.visual.appendChild(
            createFractionElement(
                problem.numerator,
                problem.denominator
            )
        );

        const division = document.createElement("div");
        division.textContent = "÷";
        division.style.fontSize = "42px";
        division.style.fontWeight = "700";

        const whole = document.createElement("div");
        whole.textContent = problem.wholeNumber;
        whole.style.fontSize = "42px";
        whole.style.fontWeight = "700";

        elements.visual.appendChild(division);
        elements.visual.appendChild(whole);

        elements.question.textContent =
            "Divide and simplify the answer.";

        elements.example.textContent =
            "Multiply by the reciprocal of the whole number.";
    },

    checkAnswer(context) {
        const correct = checkFractionEquivalentToExpected(
            context.userAnswer,
            context.problem.result.numerator,
            context.problem.result.denominator
        );

        if (correct === null) {
            return {
                correct: false,
                message:
                    "Please enter a fraction such as 1/12."
            };
        }

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Multiply by the reciprocal of the whole number."
            };
        }

        return {
            correct: true,
            simplifiedAnswer: formatFraction(
                context.problem.result.numerator,
                context.problem.result.denominator
            )
        };
    }
});


// ==================================================
// GENERATOR 17: Divide two fractions
// ==================================================

registerFractionGenerator(17, {
    title: "Divide two fractions",

    createProblem() {
        const denominator1 = randomInteger(2, 12);
        const denominator2 = randomInteger(2, 12);
        const numerator1 = randomInteger(
            1,
            denominator1 - 1
        );
        const numerator2 = randomInteger(
            1,
            denominator2 - 1
        );
        const result = divideFractions(
            numerator1,
            denominator1,
            numerator2,
            denominator2
        );

        return {
            numerator1,
            denominator1,
            numerator2,
            denominator2,
            result
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [
                {
                    numerator: problem.numerator1,
                    denominator: problem.denominator1
                },
                {
                    numerator: problem.numerator2,
                    denominator: problem.denominator2
                }
            ],
            ["÷"]
        );

        elements.question.textContent =
            "Divide the fractions and simplify the answer.";

        elements.example.textContent =
            "Keep the first fraction, change ÷ to ×, and flip the second fraction.";
    },

    checkAnswer(context) {
        const correct = checkFractionEquivalentToExpected(
            context.userAnswer,
            context.problem.result.numerator,
            context.problem.result.denominator
        );

        if (correct === null) {
            return {
                correct: false,
                message:
                    "Please enter a fraction such as 5/6."
            };
        }

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Multiply by the reciprocal of the second fraction."
            };
        }

        return {
            correct: true,
            simplifiedAnswer: formatFraction(
                context.problem.result.numerator,
                context.problem.result.denominator
            )
        };
    }
});


// ==================================================
// GENERATOR 18: Improper fraction → mixed number
// ==================================================

registerFractionGenerator(18, {
    title: "Improper fraction → mixed number",

    createProblem() {
        const denominator = randomInteger(2, 12);
        const wholeNumber = randomInteger(1, 8);
        const remainder = randomInteger(
            1,
            denominator - 1
        );
        const numerator =
            wholeNumber * denominator + remainder;

        return {
            numerator,
            denominator,
            wholeNumber,
            remainder
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderFractionExpression(
            elements.visual,
            [{
                numerator: problem.numerator,
                denominator: problem.denominator
            }]
        );

        elements.question.textContent =
            "Convert the improper fraction to a mixed number.";

        elements.example.textContent =
            "Enter the answer like this: 2 1/3";
    },

    checkAnswer(context) {
        const parsed = parseMixedNumber(
            context.userAnswer
        );

        if (!parsed) {
            return {
                correct: false,
                message:
                    "Please enter a mixed number such as 2 1/3."
            };
        }

        const converted = mixedNumberToImproperFraction(
            parsed.wholeNumber,
            parsed.numerator,
            parsed.denominator
        );

        const correct = fractionsAreEquivalent(
            converted.numerator,
            converted.denominator,
            context.problem.numerator,
            context.problem.denominator
        );

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Divide the numerator by the denominator."
            };
        }

        return {
            correct: true,
            expectedAnswer: formatMixedNumber(
                context.problem.wholeNumber,
                context.problem.remainder,
                context.problem.denominator
            )
        };
    }
});


// ==================================================
// GENERATOR 19: Mixed number → improper fraction
// ==================================================

registerFractionGenerator(19, {
    title: "Mixed number → improper fraction",

    createProblem() {
        const denominator = randomInteger(2, 12);
        const wholeNumber = randomInteger(1, 8);
        const numerator = randomInteger(
            1,
            denominator - 1
        );
        const result = mixedNumberToImproperFraction(
            wholeNumber,
            numerator,
            denominator
        );

        return {
            wholeNumber,
            numerator,
            denominator,
            result
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        renderPlainExpression(
            elements.visual,
            `${problem.wholeNumber} ${problem.numerator}/${problem.denominator}`
        );

        elements.question.textContent =
            "Convert the mixed number to an improper fraction.";

        elements.example.textContent =
            "Multiply the whole number by the denominator, then add the numerator.";
    },

    checkAnswer(context) {
        const correct = checkFractionEquivalentToExpected(
            context.userAnswer,
            context.problem.result.numerator,
            context.problem.result.denominator
        );

        if (correct === null) {
            return {
                correct: false,
                message:
                    "Please enter an improper fraction such as 7/3."
            };
        }

        if (!correct) {
            return {
                correct: false,
                message:
                    "Not quite. Multiply the whole number by the denominator, then add the numerator."
            };
        }

        return {
            correct: true,
            simplifiedAnswer: formatFraction(
                context.problem.result.numerator,
                context.problem.result.denominator
            )
        };
    }
});


// ==================================================
// GENERATOR 20: Fraction of a quantity
// ==================================================

registerFractionGenerator(20, {
    title: "Fraction of a quantity",

    createProblem() {
        const denominator = randomInteger(2, 12);
        const numerator = randomInteger(
            1,
            denominator - 1
        );
        const multiplier = randomInteger(2, 12);
        const quantity = denominator * multiplier;
        const result = numerator * multiplier;

        return {
            numerator,
            denominator,
            quantity,
            result
        };
    },

    renderProblem(context) {
        const { problem, elements } = context;

        elements.visual.replaceChildren();
        elements.visual.style.display = "flex";
        elements.visual.style.justifyContent = "center";
        elements.visual.style.alignItems = "center";
        elements.visual.style.gap = "20px";
        elements.visual.style.marginBottom = "24px";

        elements.visual.appendChild(
            createFractionElement(
                problem.numerator,
                problem.denominator
            )
        );

        const text = document.createElement("div");
        text.textContent = `of ${problem.quantity}`;
        text.style.fontSize = "42px";
        text.style.fontWeight = "700";

        elements.visual.appendChild(text);

        elements.question.textContent =
            "What is this fraction of the quantity?";

        elements.example.textContent =
            "Divide the quantity by the denominator, then multiply by the numerator.";
    },

    checkAnswer(context) {
        const normalizedAnswer = context.userAnswer.trim();

        if (!/^[+-]?\d+$/.test(normalizedAnswer)) {
            return {
                correct: false,
                message:
                    "Please enter a whole number."
            };
        }

        if (Number(normalizedAnswer) === context.problem.result) {
            return {
                correct: true,
                expectedAnswer:
                    String(context.problem.result)
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Divide the quantity by the denominator, then multiply by the numerator."
        };
    }
});


// ==================================================
// ENDE DER DATEI
// ==================================================
