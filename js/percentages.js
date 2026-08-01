"use strict";

// ==================================================
// THE MATH FINAL GIRL
// PERCENTAGES & RATIOS MASTER FILE
//
// GitHub-Zwischendatei: percentagesjs.html
// Später umbenennen in: percentages.js
//
// Diese Datei enthält ausschließlich JavaScript.
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
    mixedPracticeButtonSelector: "[data-percentage-mixed-practice]",
    hiddenClass: "is-hidden",
    activeButtonClass: "active",
    correctFeedbackClass: "correct",
    incorrectFeedbackClass: "incorrect"
};

const percentagesState = {
    activeGeneratorNumber: null,
    currentProblem: null,
    answerChecked: false,
    activeGeneratorNumbers: [],
    mixedPracticeActive: false
};

const percentageGenerators = new Map();

function registerPercentageGenerator(number, definition) {
    const generatorNumber = Number(number);
    if (!Number.isInteger(generatorNumber) || generatorNumber < 1 || generatorNumber > 20) {
        throw new Error("Generator number must be an integer from 1 to 20.");
    }
    if (!definition || typeof definition.createProblem !== "function" || typeof definition.checkAnswer !== "function") {
        throw new Error(`Generator ${generatorNumber} is incomplete.`);
    }
    percentageGenerators.set(generatorNumber, {
        number: generatorNumber,
        title: definition.title || `Generator ${generatorNumber}`,
        createProblem: definition.createProblem,
        checkAnswer: definition.checkAnswer,
        renderProblem: typeof definition.renderProblem === "function" ? definition.renderProblem : null,
        formatCorrectFeedback: typeof definition.formatCorrectFeedback === "function" ? definition.formatCorrectFeedback : null,
        formatIncorrectFeedback: typeof definition.formatIncorrectFeedback === "function" ? definition.formatIncorrectFeedback : null
    });
    updateAvailableGenerators();
}

document.addEventListener("DOMContentLoaded", initializePercentagesPage);

function initializePercentagesPage() {
    connectGeneratorButtons();
    connectMixedPracticeButton();
    connectAnswerField();
    getCheckAnswerButton()?.addEventListener("click", checkCurrentAnswer);
    getNewProblemButton()?.addEventListener("click", createNextProblem);
    updateAvailableGenerators();
}

function getElement(id) { return document.getElementById(id); }
function getExerciseArea() { return getElement(PERCENTAGES_CONFIG.exerciseAreaId); }
function getExerciseTitleElement() { return getElement(PERCENTAGES_CONFIG.titleId); }
function getProblemElement() { return getElement(PERCENTAGES_CONFIG.problemId); }
function getVisualElement() { return getElement(PERCENTAGES_CONFIG.visualId); }
function getQuestionElement() { return getElement(PERCENTAGES_CONFIG.questionId); }
function getExampleElement() { return getElement(PERCENTAGES_CONFIG.exampleId); }
function getAnswerField() { return getElement(PERCENTAGES_CONFIG.answerId); }
function getCheckAnswerButton() { return getElement(PERCENTAGES_CONFIG.checkButtonId); }
function getNewProblemButton() { return getElement(PERCENTAGES_CONFIG.newProblemButtonId); }
function getFeedbackElement() { return getElement(PERCENTAGES_CONFIG.feedbackId); }

function connectGeneratorButtons() {
    document.querySelectorAll(PERCENTAGES_CONFIG.generatorButtonSelector).forEach((button) => {
        button.addEventListener("click", () => {
            const number = Number(button.dataset.percentageGenerator);
            if (percentageGenerators.has(number)) {
                percentagesState.activeGeneratorNumber = number;
                percentagesState.mixedPracticeActive = false;
                markActiveGeneratorButton(number);
                showExerciseArea();
                createNextProblem();
            }
        });
    });
}

function connectMixedPracticeButton() {
    const button = document.querySelector(PERCENTAGES_CONFIG.mixedPracticeButtonSelector);
    if (!button) return;
    button.addEventListener("click", () => {
        updateAvailableGenerators();
        if (percentagesState.activeGeneratorNumbers.length !== 20) return;
        percentagesState.activeGeneratorNumber = null;
        percentagesState.mixedPracticeActive = true;
        markMixedPracticeButtonActive();
        showExerciseArea();
        createNextProblem();
    });
}

function connectAnswerField() {
    const field = getAnswerField();
    if (!field) return;
    field.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            checkCurrentAnswer();
        }
    });
    field.addEventListener("input", () => {
        if (percentagesState.answerChecked) {
            clearFeedback();
            percentagesState.answerChecked = false;
        }
    });
}

function markActiveGeneratorButton(number) {
    document.querySelectorAll(PERCENTAGES_CONFIG.generatorButtonSelector).forEach((button) => {
        button.classList.toggle(PERCENTAGES_CONFIG.activeButtonClass, Number(button.dataset.percentageGenerator) === number);
    });
    document.querySelector(PERCENTAGES_CONFIG.mixedPracticeButtonSelector)?.classList.remove(PERCENTAGES_CONFIG.activeButtonClass);
}

function markMixedPracticeButtonActive() {
    document.querySelectorAll(PERCENTAGES_CONFIG.generatorButtonSelector).forEach((button) => {
        button.classList.remove(PERCENTAGES_CONFIG.activeButtonClass);
    });
    document.querySelector(PERCENTAGES_CONFIG.mixedPracticeButtonSelector)?.classList.add(PERCENTAGES_CONFIG.activeButtonClass);
}

function updateAvailableGenerators() {
    percentagesState.activeGeneratorNumbers = Array.from(percentageGenerators.keys()).sort((a, b) => a - b);
    document.querySelectorAll(PERCENTAGES_CONFIG.generatorButtonSelector).forEach((button) => {
        const available = percentageGenerators.has(Number(button.dataset.percentageGenerator));
        button.disabled = !available;
        button.setAttribute("aria-disabled", String(!available));
    });
    const mixed = document.querySelector(PERCENTAGES_CONFIG.mixedPracticeButtonSelector);
    if (mixed) {
        const available = percentagesState.activeGeneratorNumbers.length === 20;
        mixed.disabled = !available;
        mixed.setAttribute("aria-disabled", String(!available));
    }
}

function createNextProblem() {
    clearFeedback();
    clearAnswerField();
    percentagesState.answerChecked = false;

    let number = percentagesState.activeGeneratorNumber;
    if (percentagesState.mixedPracticeActive) {
        number = randomItem(percentagesState.activeGeneratorNumbers);
    }
    if (!percentageGenerators.has(number)) return;

    const generator = percentageGenerators.get(number);
    try {
        const data = generator.createProblem();
        if (!data || typeof data !== "object") throw new Error("Invalid problem object.");
        percentagesState.currentProblem = { generatorNumber: number, generator, data };
        renderCurrentProblem();
        focusAnswerField();
    } catch (error) {
        console.error(error);
        showIncorrectFeedback("This exercise could not create a problem. Please choose another exercise.");
    }
}

function renderCurrentProblem() {
    const current = percentagesState.currentProblem;
    if (!current) return;
    setExerciseTitle(current.generator.title);
    clearProblemDisplay();
    const context = {
        problem: current.data,
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
    };
    if (current.generator.renderProblem) current.generator.renderProblem(context);
    else renderStandardProblem(current.data);
}

function renderStandardProblem(data) {
    getProblemElement().textContent = data.problemText || "";
    getQuestionElement().textContent = data.questionText || "";
    getExampleElement().textContent = data.exampleText || "";
    getVisualElement().replaceChildren();
}

function clearProblemDisplay() {
    getProblemElement().textContent = "";
    getQuestionElement().textContent = "";
    getExampleElement().textContent = "";
    getVisualElement().replaceChildren();
    getVisualElement().removeAttribute("style");
}

function setExerciseTitle(title) { getExerciseTitleElement().textContent = title; }

function showExerciseArea() {
    const area = getExerciseArea();
    area.hidden = false;
    area.classList.remove(PERCENTAGES_CONFIG.hiddenClass);
    area.scrollIntoView({ behavior: "smooth", block: "start" });
}

function checkCurrentAnswer() {
    const current = percentagesState.currentProblem;
    const field = getAnswerField();
    if (!current || !field) return;
    const userAnswer = field.value.trim();
    if (!userAnswer) {
        showIncorrectFeedback("Please enter an answer.");
        return;
    }
    try {
        const result = normalizeCheckResult(current.generator.checkAnswer({
            userAnswer,
            problem: current.data,
            helpers: percentageHelperFunctions
        }));
        percentagesState.answerChecked = true;
        if (result.correct) {
            showCorrectFeedback(createCorrectFeedbackMessage(current.generator, result, current.data));
        } else {
            showIncorrectFeedback(createIncorrectFeedbackMessage(current.generator, result, current.data));
        }
    } catch (error) {
        console.error(error);
        showIncorrectFeedback("This exercise could not check the answer. Please try a new problem.");
    }
}

function normalizeCheckResult(result) {
    if (typeof result === "boolean") return { correct: result, message: "", simplifiedAnswer: "", expectedAnswer: "" };
    if (!result || typeof result !== "object") return { correct: false, message: "", simplifiedAnswer: "", expectedAnswer: "" };
    return {
        correct: result.correct === true,
        message: typeof result.message === "string" ? result.message : "",
        simplifiedAnswer: typeof result.simplifiedAnswer === "string" ? result.simplifiedAnswer : "",
        expectedAnswer: typeof result.expectedAnswer === "string" ? result.expectedAnswer : ""
    };
}

function createCorrectFeedbackMessage(generator, result, problem) {
    if (result.message) return result.message;
    if (generator.formatCorrectFeedback) return generator.formatCorrectFeedback({ result, problem, helpers: percentageHelperFunctions });
    if (result.simplifiedAnswer) return `Correct. Simplified answer: ${result.simplifiedAnswer}`;
    if (result.expectedAnswer) return `Correct. Answer: ${result.expectedAnswer}`;
    return "Correct.";
}

function createIncorrectFeedbackMessage(generator, result, problem) {
    if (result.message) return result.message;
    if (generator.formatIncorrectFeedback) return generator.formatIncorrectFeedback({ result, problem, helpers: percentageHelperFunctions });
    return "Not quite. Try again.";
}

function showCorrectFeedback(message) {
    const feedback = getFeedbackElement();
    feedback.textContent = message;
    feedback.hidden = false;
    feedback.classList.add(PERCENTAGES_CONFIG.correctFeedbackClass);
    feedback.classList.remove(PERCENTAGES_CONFIG.incorrectFeedbackClass);
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
}

function showIncorrectFeedback(message) {
    const feedback = getFeedbackElement();
    feedback.textContent = message;
    feedback.hidden = false;
    feedback.classList.add(PERCENTAGES_CONFIG.incorrectFeedbackClass);
    feedback.classList.remove(PERCENTAGES_CONFIG.correctFeedbackClass);
    feedback.setAttribute("role", "alert");
    feedback.setAttribute("aria-live", "assertive");
}

function clearFeedback() {
    const feedback = getFeedbackElement();
    if (!feedback) return;
    feedback.textContent = "";
    feedback.hidden = true;
    feedback.classList.remove(PERCENTAGES_CONFIG.correctFeedbackClass, PERCENTAGES_CONFIG.incorrectFeedbackClass);
}

function clearAnswerField() {
    const field = getAnswerField();
    if (field) field.value = "";
}

function focusAnswerField() {
    const field = getAnswerField();
    if (field) window.setTimeout(() => field.focus({ preventScroll: true }), 0);
}

function greatestCommonDivisor(a, b) {
    let first = Math.abs(Number(a));
    let second = Math.abs(Number(b));
    if (!Number.isInteger(first) || !Number.isInteger(second)) return 1;
    while (second !== 0) [first, second] = [second, first % second];
    return first === 0 ? 1 : first;
}

function simplifyFraction(numerator, denominator) {
    let top = Number(numerator);
    let bottom = Number(denominator);
    if (!Number.isInteger(top) || !Number.isInteger(bottom) || bottom === 0) return null;
    if (bottom < 0) { top *= -1; bottom *= -1; }
    const divisor = greatestCommonDivisor(top, bottom);
    return { numerator: top / divisor, denominator: bottom / divisor };
}

function formatFraction(numerator, denominator) {
    const fraction = simplifyFraction(numerator, denominator);
    if (!fraction) return "";
    return fraction.denominator === 1 ? String(fraction.numerator) : `${fraction.numerator}/${fraction.denominator}`;
}

function parseFraction(value) {
    const match = String(value).trim().replace(/\s+/g, "").match(/^([+-]?\d+)\/([+-]?\d+)$/);
    if (!match || Number(match[2]) === 0) return null;
    const originalNumerator = Number(match[1]);
    const originalDenominator = Number(match[2]);
    const simplified = simplifyFraction(originalNumerator, originalDenominator);
    return { originalNumerator, originalDenominator, numerator: simplified.numerator, denominator: simplified.denominator };
}

function parseNumber(value) {
    const normalized = String(value).trim().replace(",", ".").replace(/[%$€£]/g, "").replace(/\s+/g, "");
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
}

function parsePercentage(value) { return parseNumber(value); }

function parseRatio(value) {
    const match = String(value).trim().replace(/\s+/g, "").match(/^(\d+):(\d+)$/);
    if (!match || Number(match[1]) <= 0 || Number(match[2]) <= 0) return null;
    return { first: Number(match[1]), second: Number(match[2]) };
}

function simplifyRatio(first, second) {
    const divisor = greatestCommonDivisor(first, second);
    return { first: first / divisor, second: second / divisor };
}

function numbersAreClose(a, b, tolerance = 0.000001) { return Math.abs(Number(a) - Number(b)) <= tolerance; }
function roundTo(value, places = 2) { const factor = 10 ** places; return Math.round((Number(value) + Number.EPSILON) * factor) / factor; }
function formatNumber(value, places = 2) { return String(roundTo(value, places)); }
function formatMoney(value) { return Number(roundTo(value, 2)).toFixed(2); }
function randomInteger(minimum, maximum) { return Math.floor(Math.random() * (Math.floor(maximum) - Math.ceil(minimum) + 1)) + Math.ceil(minimum); }
function randomItem(items) { return items[randomInteger(0, items.length - 1)]; }

const percentageHelperFunctions = Object.freeze({
    greatestCommonDivisor, simplifyFraction, formatFraction, parseFraction,
    parseNumber, parsePercentage, parseRatio, simplifyRatio, numbersAreClose,
    roundTo, formatNumber, formatMoney, randomInteger, randomItem,
    showCorrectFeedback, showIncorrectFeedback, clearFeedback
});

function standardProblem(problemText, questionText, exampleText, extra = {}) {
    return { problemText, questionText, exampleText, ...extra };
}

function numberResult(userAnswer, expected, help, suffix = "") {
    const answer = parseNumber(userAnswer);
    if (answer === null) return { correct: false, message: "Please enter a number." };
    if (numbersAreClose(answer, expected)) return { correct: true, expectedAnswer: `${formatNumber(expected, 4)}${suffix}` };
    return { correct: false, message: help };
}

function percentageResult(userAnswer, expected, help) {
    const answer = parsePercentage(userAnswer);
    if (answer === null) return { correct: false, message: "Please enter a percentage." };
    if (numbersAreClose(answer, expected)) return { correct: true, expectedAnswer: `${formatNumber(expected, 4)}%` };
    return { correct: false, message: help };
}

// ==================================================
// GENERATOR 01: Percentage → decimal
// ==================================================
registerPercentageGenerator(1, {
    title: "Percentage → decimal",
    createProblem() {
        const percentage = randomInteger(1, 250);
        return standardProblem(`${percentage}%`, "Convert the percentage to a decimal.", "Example: 35% → 0.35", { percentage });
    },
    checkAnswer({ userAnswer, problem }) {
        return numberResult(userAnswer, problem.percentage / 100, "Not quite. Divide the percentage by 100.");
    }
});

// ==================================================
// GENERATOR 02: Decimal → percentage
// ==================================================
registerPercentageGenerator(2, {
    title: "Decimal → percentage",
    createProblem() {
        const percentage = randomInteger(1, 250);
        const decimal = percentage / 100;
        return standardProblem(formatNumber(decimal, 2), "Convert the decimal to a percentage.", "Example: 0.35 → 35%", { percentage });
    },
    checkAnswer({ userAnswer, problem }) {
        return percentageResult(userAnswer, problem.percentage, "Not quite. Multiply the decimal by 100.");
    }
});

// ==================================================
// GENERATOR 03: Fraction → percentage
// ==================================================
registerPercentageGenerator(3, {
    title: "Fraction → percentage",
    createProblem() {
        const [numerator, denominator] = randomItem([[1,2],[1,4],[3,4],[1,5],[2,5],[3,5],[4,5],[1,10],[3,10],[7,10],[1,20],[3,20],[7,20],[9,20]]);
        return standardProblem(`${numerator}/${denominator}`, "Convert the fraction to a percentage.", "Example: 3/4 → 75%", { numerator, denominator, percentage: numerator / denominator * 100 });
    },
    checkAnswer({ userAnswer, problem }) {
        return percentageResult(userAnswer, problem.percentage, "Not quite. Divide the numerator by the denominator, then multiply by 100.");
    }
});

// ==================================================
// GENERATOR 04: Percentage → fraction
// ==================================================
registerPercentageGenerator(4, {
    title: "Percentage → fraction",
    createProblem() {
        const percentage = randomItem([5,10,15,20,25,30,35,40,45,50,55,60,65,70,75,80,85,90,95,125,150]);
        const fraction = simplifyFraction(percentage, 100);
        return standardProblem(`${percentage}%`, "Convert the percentage to a fraction and simplify it.", "Example: 75% → 3/4", { fraction });
    },
    checkAnswer({ userAnswer, problem }) {
        const answer = parseFraction(userAnswer);
        if (!answer) return { correct: false, message: "Please enter a fraction such as 3/4." };
        if (answer.numerator === problem.fraction.numerator && answer.denominator === problem.fraction.denominator) {
            return { correct: true, simplifiedAnswer: formatFraction(problem.fraction.numerator, problem.fraction.denominator) };
        }
        return { correct: false, message: "Not quite. Write the percentage over 100, then simplify." };
    }
});

// ==================================================
// GENERATOR 05: Find a percentage of a number
// ==================================================
registerPercentageGenerator(5, {
    title: "Find a percentage of a number",
    createProblem() {
        const percentage = randomItem([5,10,15,20,25,30,40,50,60,75]);
        const whole = randomInteger(2, 20) * 20;
        const result = whole * percentage / 100;
        return standardProblem(`${percentage}% of ${whole}`, "Find the value.", "Convert the percentage to a decimal and multiply.", { result });
    },
    checkAnswer({ userAnswer, problem }) {
        return numberResult(userAnswer, problem.result, "Not quite. Convert the percentage to a decimal and multiply.");
    }
});

// ==================================================
// GENERATOR 06: What percentage is one number of another?
// ==================================================
registerPercentageGenerator(6, {
    title: "What percentage is one number of another?",
    createProblem() {
        const percentage = randomItem([10,20,25,30,40,50,60,75,80,90]);
        const whole = randomInteger(2, 20) * 20;
        const part = whole * percentage / 100;
        return standardProblem(`${part} is what percentage of ${whole}?`, "Enter the percentage.", "Part ÷ whole × 100.", { percentage });
    },
    checkAnswer({ userAnswer, problem }) {
        return percentageResult(userAnswer, problem.percentage, "Not quite. Divide the part by the whole, then multiply by 100.");
    }
});

// ==================================================
// GENERATOR 07: Find the whole from a percentage and a part
// ==================================================
registerPercentageGenerator(7, {
    title: "Find the whole from a percentage and a part",
    createProblem() {
        const percentage = randomItem([10,20,25,40,50,60,75,80]);
        const whole = randomInteger(2, 20) * 20;
        const part = whole * percentage / 100;
        return standardProblem(`${part} is ${percentage}% of what number?`, "Find the whole.", "Divide the part by the percentage as a decimal.", { whole });
    },
    checkAnswer({ userAnswer, problem }) {
        return numberResult(userAnswer, problem.whole, "Not quite. Divide the part by the percentage as a decimal.");
    }
});

// ==================================================
// GENERATOR 08: Find the percentage rate
// ==================================================
registerPercentageGenerator(8, {
    title: "Find the percentage rate",
    createProblem() {
        const rate = randomItem([5,10,15,20,25,30,40,50,60,75,80]);
        const whole = randomInteger(2, 20) * 20;
        const part = whole * rate / 100;
        return standardProblem(`${part} of ${whole}`, "Find the percentage rate.", "Part ÷ whole × 100.", { rate });
    },
    checkAnswer({ userAnswer, problem }) {
        return percentageResult(userAnswer, problem.rate, "Not quite. Divide the part by the whole, then multiply by 100.");
    }
});

// ==================================================
// GENERATOR 09: Increase a number by a percentage
// ==================================================
registerPercentageGenerator(9, {
    title: "Increase a number by a percentage",
    createProblem() {
        const original = randomInteger(2, 40) * 5;
        const percentage = randomItem([5,10,15,20,25,30,40,50]);
        const result = original * (1 + percentage / 100);
        return standardProblem(`Increase ${original} by ${percentage}%`, "Find the new value.", "Find the increase and add it to the original value.", { result });
    },
    checkAnswer({ userAnswer, problem }) {
        return numberResult(userAnswer, problem.result, "Not quite. Find the percentage increase and add it to the original value.");
    }
});

// ==================================================
// GENERATOR 10: Decrease a number by a percentage
// ==================================================
registerPercentageGenerator(10, {
    title: "Decrease a number by a percentage",
    createProblem() {
        const original = randomInteger(2, 40) * 5;
        const percentage = randomItem([5,10,15,20,25,30,40,50]);
        const result = original * (1 - percentage / 100);
        return standardProblem(`Decrease ${original} by ${percentage}%`, "Find the new value.", "Find the decrease and subtract it from the original value.", { result });
    },
    checkAnswer({ userAnswer, problem }) {
        return numberResult(userAnswer, problem.result, "Not quite. Find the percentage decrease and subtract it from the original value.");
    }
});

// ==================================================
// GENERATOR 11: Percentage increase
// ==================================================
registerPercentageGenerator(11, {
    title: "Percentage increase",
    createProblem() {
        const original = randomInteger(2, 20) * 20;
        const percentage = randomItem([10,20,25,30,40,50,60,75]);
        const newValue = original * (1 + percentage / 100);
        return standardProblem(`${original} → ${formatNumber(newValue, 2)}`, "What is the percentage increase?", "Increase ÷ original × 100.", { percentage });
    },
    checkAnswer({ userAnswer, problem }) {
        return percentageResult(userAnswer, problem.percentage, "Not quite. Divide the increase by the original value, then multiply by 100.");
    }
});

// ==================================================
// GENERATOR 12: Percentage decrease
// ==================================================
registerPercentageGenerator(12, {
    title: "Percentage decrease",
    createProblem() {
        const original = randomInteger(2, 20) * 20;
        const percentage = randomItem([10,20,25,30,40,50,60,75]);
        const newValue = original * (1 - percentage / 100);
        return standardProblem(`${original} → ${formatNumber(newValue, 2)}`, "What is the percentage decrease?", "Decrease ÷ original × 100.", { percentage });
    },
    checkAnswer({ userAnswer, problem }) {
        return percentageResult(userAnswer, problem.percentage, "Not quite. Divide the decrease by the original value, then multiply by 100.");
    }
});

// ==================================================
// GENERATOR 13: Simplify a ratio
// ==================================================
registerPercentageGenerator(13, {
    title: "Simplify a ratio",
    createProblem() {
        let first = randomInteger(1, 12);
        let second = randomInteger(1, 12);
        while (greatestCommonDivisor(first, second) !== 1) {
            first = randomInteger(1, 12);
            second = randomInteger(1, 12);
        }
        const multiplier = randomInteger(2, 10);
        return standardProblem(`${first * multiplier}:${second * multiplier}`, "Simplify the ratio.", "Divide both parts by their greatest common divisor.", { first, second });
    },
    checkAnswer({ userAnswer, problem }) {
        const answer = parseRatio(userAnswer);
        if (!answer) return { correct: false, message: "Please enter a ratio such as 3:4." };
        const simplified = simplifyRatio(answer.first, answer.second);
        if (simplified.first === problem.first && simplified.second === problem.second) {
            return { correct: true, simplifiedAnswer: `${problem.first}:${problem.second}` };
        }
        return { correct: false, message: "Not quite. Divide both parts by their greatest common divisor." };
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
        const missingFirst = Math.random() < 0.5;
        const expected = missingFirst ? first * multiplier : second * multiplier;
        const text = missingFirst ? `${first}:${second} = ?:${second * multiplier}` : `${first}:${second} = ${first * multiplier}:?`;
        return standardProblem(text, "Find the missing value.", "Multiply both parts by the same number.", { expected });
    },
    checkAnswer({ userAnswer, problem }) {
        return numberResult(userAnswer, problem.expected, "Not quite. Multiply both parts by the same number.");
    }
});

// ==================================================
// GENERATOR 15: Missing value in a ratio
// ==================================================
registerPercentageGenerator(15, {
    title: "Missing value in a ratio",
    createProblem() {
        const first = randomInteger(1, 12);
        const second = randomInteger(1, 12);
        const multiplier = randomInteger(2, 10);
        const values = [first, second, first * multiplier, second * multiplier];
        const missing = randomInteger(0, 3);
        const shown = values.map((value, index) => index === missing ? "?" : value);
        return standardProblem(`${shown[0]}:${shown[1]} = ${shown[2]}:${shown[3]}`, "Find the missing value.", "Use the same scale factor on both sides.", { expected: values[missing] });
    },
    checkAnswer({ userAnswer, problem }) {
        return numberResult(userAnswer, problem.expected, "Not quite. Use the same scale factor on both sides.");
    }
});

// ==================================================
// GENERATOR 16: Divide a quantity in a ratio
// ==================================================
registerPercentageGenerator(16, {
    title: "Divide a quantity in a ratio",
    createProblem() {
        const first = randomInteger(1, 8);
        const second = randomInteger(1, 8);
        const unit = randomInteger(2, 20);
        const total = (first + second) * unit;
        return standardProblem(`Divide ${total} in the ratio ${first}:${second}`, "Enter the two shares separated by a comma.", "Example: 30, 20", { firstShare: first * unit, secondShare: second * unit });
    },
    checkAnswer({ userAnswer, problem }) {
        const parts = userAnswer.split(/[,;]/).map(parseNumber);
        if (parts.length !== 2 || parts.some((value) => value === null)) return { correct: false, message: "Please enter two numbers separated by a comma." };
        if (numbersAreClose(parts[0], problem.firstShare) && numbersAreClose(parts[1], problem.secondShare)) {
            return { correct: true, expectedAnswer: `${formatNumber(problem.firstShare)}, ${formatNumber(problem.secondShare)}` };
        }
        return { correct: false, message: "Not quite. Add the ratio parts, divide the total by that sum, then multiply." };
    }
});

// ==================================================
// GENERATOR 17: Discounts
// ==================================================
registerPercentageGenerator(17, {
    title: "Discounts",
    createProblem() {
        const price = randomInteger(2, 40) * 5;
        const discount = randomItem([5,10,15,20,25,30,40,50]);
        const result = price * (1 - discount / 100);
        return standardProblem(`$${price} with ${discount}% off`, "What is the sale price?", "Find the discount and subtract it from the original price.", { result });
    },
    checkAnswer({ userAnswer, problem }) {
        const answer = parseNumber(userAnswer);
        if (answer === null) return { correct: false, message: "Please enter a price." };
        if (numbersAreClose(answer, problem.result)) return { correct: true, expectedAnswer: `$${formatMoney(problem.result)}` };
        return { correct: false, message: "Not quite. Find the discount amount and subtract it from the original price." };
    }
});

// ==================================================
// GENERATOR 18: Sales tax / VAT
// ==================================================
registerPercentageGenerator(18, {
    title: "Sales tax / VAT",
    createProblem() {
        const price = randomInteger(2, 40) * 5;
        const tax = randomItem([5,8,10,15,20]);
        const result = price * (1 + tax / 100);
        return standardProblem(`$${price} plus ${tax}% tax`, "What is the total price?", "Find the tax and add it to the original price.", { result });
    },
    checkAnswer({ userAnswer, problem }) {
        const answer = parseNumber(userAnswer);
        if (answer === null) return { correct: false, message: "Please enter a price." };
        if (numbersAreClose(answer, problem.result)) return { correct: true, expectedAnswer: `$${formatMoney(problem.result)}` };
        return { correct: false, message: "Not quite. Find the tax amount and add it to the original price." };
    }
});

// ==================================================
// GENERATOR 19: Simple interest
// ==================================================
registerPercentageGenerator(19, {
    title: "Simple interest",
    createProblem() {
        const principal = randomInteger(2, 20) * 100;
        const rate = randomItem([2,3,4,5,6,8,10]);
        const years = randomInteger(1, 10);
        const result = principal * rate / 100 * years;
        return standardProblem(`$${principal} at ${rate}% for ${years} year${years === 1 ? "" : "s"}`, "Find the simple interest.", "Interest = principal × rate × time.", { result });
    },
    checkAnswer({ userAnswer, problem }) {
        const answer = parseNumber(userAnswer);
        if (answer === null) return { correct: false, message: "Please enter an amount." };
        if (numbersAreClose(answer, problem.result)) return { correct: true, expectedAnswer: `$${formatMoney(problem.result)}` };
        return { correct: false, message: "Not quite. Multiply principal × rate as a decimal × time." };
    }
});

// ==================================================
// GENERATOR 20: Percentage and ratio word problems
// ==================================================
registerPercentageGenerator(20, {
    title: "Percentage and ratio word problems",
    createProblem() {
        const type = randomItem(["students", "ratio", "saving"]);
        if (type === "students") {
            const total = randomItem([20,24,28,32,40]);
            const percentage = randomItem([25,50,75]);
            const expected = total * percentage / 100;
            return standardProblem(`${percentage}% of ${total} students joined a club.`, "How many students joined?", "Find the stated percentage of the total.", { type, expected });
        }
        if (type === "ratio") {
            const first = randomInteger(1, 5);
            const second = randomInteger(1, 5);
            const unit = randomInteger(2, 8);
            const total = (first + second) * unit;
            return standardProblem(`${total} items are divided in the ratio ${first}:${second}.`, "Enter the two shares separated by a comma.", "Add the ratio parts, find one part, then multiply.", { type, firstShare: first * unit, secondShare: second * unit });
        }
        const price = randomInteger(4, 20) * 10;
        const percentage = randomItem([10,20,25,50]);
        const expected = price * percentage / 100;
        return standardProblem(`A customer saves ${percentage}% on a $${price} item.`, "How much money is saved?", "Find the percentage of the original price.", { type, expected });
    },
    checkAnswer({ userAnswer, problem }) {
        if (problem.type === "ratio") {
            const parts = userAnswer.split(/[,;]/).map(parseNumber);
            if (parts.length !== 2 || parts.some((value) => value === null)) return { correct: false, message: "Please enter two numbers separated by a comma." };
            if (numbersAreClose(parts[0], problem.firstShare) && numbersAreClose(parts[1], problem.secondShare)) {
                return { correct: true, expectedAnswer: `${formatNumber(problem.firstShare)}, ${formatNumber(problem.secondShare)}` };
            }
            return { correct: false, message: "Not quite. Add the ratio parts, find one part, then multiply." };
        }
        return numberResult(userAnswer, problem.expected, "Not quite. Identify the whole, convert the percentage, and multiply.");
    }
});

// ==================================================
// ENDE DER DATEI
// ==================================================
