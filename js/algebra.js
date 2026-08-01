"use strict";

// ==================================================
// THE MATH FINAL GIRL
// ALGEBRA I MASTER FILE
//
// GitHub-Zwischendatei: algebrajs.html
// Später umbenennen in: algebra.js
//
// Diese Datei enthält ausschließlich JavaScript.
// ==================================================

const ALGEBRA_CONFIG = {
    exerciseAreaId: "algebra-exercise-area",
    titleId: "algebra-exercise-title",
    problemId: "algebra-problem",
    visualId: "algebra-visual",
    questionId: "algebra-question",
    exampleId: "algebra-example",
    answerId: "algebra-answer",
    checkButtonId: "algebra-check-answer",
    newProblemButtonId: "algebra-new-problem",
    feedbackId: "algebra-feedback",
    generatorButtonSelector: "[data-algebra-generator]",
    mixedPracticeButtonSelector: "[data-algebra-mixed-practice]",
    hiddenClass: "is-hidden",
    activeButtonClass: "active",
    correctFeedbackClass: "correct",
    incorrectFeedbackClass: "incorrect"
};

const algebraState = {
    activeGeneratorNumber: null,
    currentProblem: null,
    answerChecked: false,
    activeGeneratorNumbers: [],
    mixedPracticeActive: false
};

const algebraGenerators = new Map();

function registerAlgebraGenerator(number, definition) {
    const generatorNumber = Number(number);

    if (!Number.isInteger(generatorNumber) || generatorNumber < 1 || generatorNumber > 20) {
        throw new Error("Generator number must be an integer from 1 to 20.");
    }

    if (
        !definition ||
        typeof definition !== "object" ||
        typeof definition.createProblem !== "function" ||
        typeof definition.checkAnswer !== "function"
    ) {
        throw new Error(`Generator ${generatorNumber} is incomplete.`);
    }

    algebraGenerators.set(generatorNumber, {
        number: generatorNumber,
        title:
            typeof definition.title === "string"
                ? definition.title
                : `Generator ${generatorNumber}`,
        createProblem: definition.createProblem,
        checkAnswer: definition.checkAnswer,
        renderProblem:
            typeof definition.renderProblem === "function"
                ? definition.renderProblem
                : null,
        formatCorrectFeedback:
            typeof definition.formatCorrectFeedback === "function"
                ? definition.formatCorrectFeedback
                : null,
        formatIncorrectFeedback:
            typeof definition.formatIncorrectFeedback === "function"
                ? definition.formatIncorrectFeedback
                : null
    });

    updateAvailableGenerators();
}

document.addEventListener("DOMContentLoaded", initializeAlgebraPage);

function initializeAlgebraPage() {
    connectGeneratorButtons();
    connectMixedPracticeButton();
    connectAnswerField();
    connectCheckAnswerButton();
    connectNewProblemButton();
    updateAvailableGenerators();
    deactivateUnavailableGeneratorButtons();
}

function getAlgebraElement(id) {
    return document.getElementById(id);
}

function getExerciseArea() {
    return getAlgebraElement(ALGEBRA_CONFIG.exerciseAreaId);
}

function getExerciseTitleElement() {
    return getAlgebraElement(ALGEBRA_CONFIG.titleId);
}

function getProblemElement() {
    return getAlgebraElement(ALGEBRA_CONFIG.problemId);
}

function getVisualElement() {
    return getAlgebraElement(ALGEBRA_CONFIG.visualId);
}

function getQuestionElement() {
    return getAlgebraElement(ALGEBRA_CONFIG.questionId);
}

function getExampleElement() {
    return getAlgebraElement(ALGEBRA_CONFIG.exampleId);
}

function getAnswerField() {
    return getAlgebraElement(ALGEBRA_CONFIG.answerId);
}

function getCheckAnswerButton() {
    return getAlgebraElement(ALGEBRA_CONFIG.checkButtonId);
}

function getNewProblemButton() {
    return getAlgebraElement(ALGEBRA_CONFIG.newProblemButtonId);
}

function getFeedbackElement() {
    return getAlgebraElement(ALGEBRA_CONFIG.feedbackId);
}

function connectGeneratorButtons() {
    document
        .querySelectorAll(ALGEBRA_CONFIG.generatorButtonSelector)
        .forEach((button) => {
            button.addEventListener("click", handleGeneratorButtonClick);
        });
}

function connectMixedPracticeButton() {
    const button = document.querySelector(
        ALGEBRA_CONFIG.mixedPracticeButtonSelector
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
        if (algebraState.answerChecked) {
            clearFeedback();
            algebraState.answerChecked = false;
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

function handleGeneratorButtonClick(event) {
    const generatorNumber = Number(
        event.currentTarget.dataset.algebraGenerator
    );

    if (algebraGenerators.has(generatorNumber)) {
        startAlgebraGenerator(generatorNumber);
    }
}

function startAlgebraGenerator(generatorNumber) {
    const number = Number(generatorNumber);

    if (!algebraGenerators.has(number)) {
        return;
    }

    algebraState.activeGeneratorNumber = number;
    algebraState.mixedPracticeActive = false;

    markActiveGeneratorButton(number);
    showExerciseArea();
    createNextProblem();
}

function markActiveGeneratorButton(generatorNumber) {
    document
        .querySelectorAll(ALGEBRA_CONFIG.generatorButtonSelector)
        .forEach((button) => {
            button.classList.toggle(
                ALGEBRA_CONFIG.activeButtonClass,
                Number(button.dataset.algebraGenerator) === generatorNumber
            );
        });

    const mixedPracticeButton = document.querySelector(
        ALGEBRA_CONFIG.mixedPracticeButtonSelector
    );

    if (mixedPracticeButton) {
        mixedPracticeButton.classList.remove(
            ALGEBRA_CONFIG.activeButtonClass
        );
    }
}

function markMixedPracticeButtonActive() {
    document
        .querySelectorAll(ALGEBRA_CONFIG.generatorButtonSelector)
        .forEach((button) => {
            button.classList.remove(ALGEBRA_CONFIG.activeButtonClass);
        });

    const mixedPracticeButton = document.querySelector(
        ALGEBRA_CONFIG.mixedPracticeButtonSelector
    );

    if (mixedPracticeButton) {
        mixedPracticeButton.classList.add(
            ALGEBRA_CONFIG.activeButtonClass
        );
    }
}

function deactivateUnavailableGeneratorButtons() {
    document
        .querySelectorAll(ALGEBRA_CONFIG.generatorButtonSelector)
        .forEach((button) => {
            const generatorNumber = Number(
                button.dataset.algebraGenerator
            );

            const available = algebraGenerators.has(generatorNumber);

            button.disabled = !available;
            button.setAttribute("aria-disabled", String(!available));
        });

    updateMixedPracticeButton();
}

function updateMixedPracticeButton() {
    const button = document.querySelector(
        ALGEBRA_CONFIG.mixedPracticeButtonSelector
    );

    if (!button) {
        return;
    }

    const available =
        algebraState.activeGeneratorNumbers.length === 20;

    button.disabled = !available;
    button.setAttribute("aria-disabled", String(!available));
}

function updateAvailableGenerators() {
    algebraState.activeGeneratorNumbers = Array.from(
        algebraGenerators.keys()
    ).sort((first, second) => first - second);

    deactivateUnavailableGeneratorButtons();
}

function startMixedPractice() {
    updateAvailableGenerators();

    if (algebraState.activeGeneratorNumbers.length !== 20) {
        return;
    }

    algebraState.mixedPracticeActive = true;
    algebraState.activeGeneratorNumber = null;

    markMixedPracticeButtonActive();
    showExerciseArea();
    createNextProblem();
}

function chooseRandomActiveGeneratorNumber() {
    return randomItem(algebraState.activeGeneratorNumbers);
}

function createNextProblem() {
    clearFeedback();
    clearAnswerField();

    algebraState.answerChecked = false;

    let generatorNumber = algebraState.activeGeneratorNumber;

    if (algebraState.mixedPracticeActive) {
        generatorNumber = chooseRandomActiveGeneratorNumber();
    }

    if (
        generatorNumber === null ||
        !algebraGenerators.has(generatorNumber)
    ) {
        return;
    }

    const generator = algebraGenerators.get(generatorNumber);

    try {
        const problem = generator.createProblem();

        if (!problem || typeof problem !== "object") {
            throw new Error("Invalid problem object.");
        }

        algebraState.currentProblem = {
            generatorNumber,
            generator,
            data: problem
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

function renderCurrentProblem() {
    const currentProblem = algebraState.currentProblem;

    if (!currentProblem) {
        return;
    }

    setExerciseTitle(currentProblem.generator.title);
    clearProblemDisplay();

    const context = {
        problem: currentProblem.data,
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
        helpers: algebraHelperFunctions
    };

    if (currentProblem.generator.renderProblem) {
        currentProblem.generator.renderProblem(context);
        return;
    }

    renderStandardProblem(currentProblem.data);
}

function renderStandardProblem(problem) {
    const problemElement = getProblemElement();
    const questionElement = getQuestionElement();
    const exampleElement = getExampleElement();
    const visualElement = getVisualElement();

    if (problemElement) {
        problemElement.textContent = problem.problemText || "";
    }

    if (questionElement) {
        questionElement.textContent = problem.questionText || "";
    }

    if (exampleElement) {
        exampleElement.textContent = problem.exampleText || "";
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
    exerciseArea.classList.remove(ALGEBRA_CONFIG.hiddenClass);

    exerciseArea.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function checkCurrentAnswer() {
    const currentProblem = algebraState.currentProblem;
    const answerField = getAnswerField();

    if (!currentProblem || !answerField) {
        return;
    }

    const userAnswer = answerField.value.trim();

    if (userAnswer === "") {
        showIncorrectFeedback("Please enter an answer.");
        return;
    }

    try {
        const result = normalizeCheckResult(
            currentProblem.generator.checkAnswer({
                userAnswer,
                problem: currentProblem.data,
                helpers: algebraHelperFunctions
            })
        );

        algebraState.answerChecked = true;

        if (result.correct) {
            showCorrectFeedback(
                createCorrectFeedbackMessage(
                    currentProblem.generator,
                    result,
                    currentProblem.data
                )
            );
        } else {
            showIncorrectFeedback(
                createIncorrectFeedbackMessage(
                    currentProblem.generator,
                    result,
                    currentProblem.data
                )
            );
        }
    } catch (error) {
        console.error(error);
        showIncorrectFeedback(
            "This exercise could not check the answer. Please try a new problem."
        );
    }
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

function createCorrectFeedbackMessage(generator, result, problem) {
    if (result.message) {
        return result.message;
    }

    if (generator.formatCorrectFeedback) {
        return generator.formatCorrectFeedback({
            result,
            problem,
            helpers: algebraHelperFunctions
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

function createIncorrectFeedbackMessage(generator, result, problem) {
    if (result.message) {
        return result.message;
    }

    if (generator.formatIncorrectFeedback) {
        return generator.formatIncorrectFeedback({
            result,
            problem,
            helpers: algebraHelperFunctions
        });
    }

    return "Not quite. Try again.";
}

function showCorrectFeedback(message) {
    const feedbackElement = getFeedbackElement();

    if (!feedbackElement) {
        return;
    }

    feedbackElement.textContent = message;
    feedbackElement.hidden = false;
    feedbackElement.classList.add(
        ALGEBRA_CONFIG.correctFeedbackClass
    );
    feedbackElement.classList.remove(
        ALGEBRA_CONFIG.incorrectFeedbackClass
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
        ALGEBRA_CONFIG.incorrectFeedbackClass
    );
    feedbackElement.classList.remove(
        ALGEBRA_CONFIG.correctFeedbackClass
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
        ALGEBRA_CONFIG.correctFeedbackClass,
        ALGEBRA_CONFIG.incorrectFeedbackClass
    );
}

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

function randomInteger(minimum, maximum) {
    const min = Math.ceil(Number(minimum));
    const max = Math.floor(Number(maximum));

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;
}

function randomNonZeroInteger(minimum, maximum) {
    let value = 0;

    while (value === 0) {
        value = randomInteger(minimum, maximum);
    }

    return value;
}

function randomItem(items) {
    return items[randomInteger(0, items.length - 1)];
}

function greatestCommonDivisor(firstNumber, secondNumber) {
    let first = Math.abs(Number(firstNumber));
    let second = Math.abs(Number(secondNumber));

    while (second !== 0) {
        [first, second] = [second, first % second];
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
    const fraction = simplifyFraction(numerator, denominator);

    if (!fraction) {
        return "";
    }

    return fraction.denominator === 1
        ? String(fraction.numerator)
        : `${fraction.numerator}/${fraction.denominator}`;
}

function parseNumber(value) {
    const normalizedValue = String(value)
        .trim()
        .replace(",", ".")
        .replace(/\s+/g, "");

    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(normalizedValue)) {
        return null;
    }

    const number = Number(normalizedValue);

    return Number.isFinite(number) ? number : null;
}

function parseFractionOrNumber(value) {
    const normalizedValue = String(value).trim().replace(/\s+/g, "");

    const fractionMatch = normalizedValue.match(
        /^([+-]?\d+)\/([+-]?\d+)$/
    );

    if (fractionMatch) {
        const denominator = Number(fractionMatch[2]);

        if (denominator === 0) {
            return null;
        }

        return Number(fractionMatch[1]) / denominator;
    }

    return parseNumber(normalizedValue);
}

function numbersAreClose(first, second, tolerance = 0.000001) {
    return Math.abs(Number(first) - Number(second)) <= tolerance;
}

function normalizeExpression(value) {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/\*/g, "");
}

function formatCoefficient(coefficient, variable = "x") {
    if (coefficient === 0) {
        return "";
    }

    if (coefficient === 1) {
        return variable;
    }

    if (coefficient === -1) {
        return `-${variable}`;
    }

    return `${coefficient}${variable}`;
}

function formatLinearExpression(coefficient, constant, variable = "x") {
    const variablePart = formatCoefficient(coefficient, variable);

    if (constant === 0) {
        return variablePart || "0";
    }

    if (!variablePart) {
        return String(constant);
    }

    return constant > 0
        ? `${variablePart} + ${constant}`
        : `${variablePart} - ${Math.abs(constant)}`;
}

function parseInequalityAnswer(value) {
    const normalizedValue = String(value)
        .trim()
        .replace(/\s+/g, "")
        .replace(/≤/g, "<=")
        .replace(/≥/g, ">=");

    const match = normalizedValue.match(
        /^x(<=|>=|<|>)([+-]?(?:\d+\.?\d*|\.\d+)|[+-]?\d+\/[+-]?\d+)$/
    );

    if (!match) {
        return null;
    }

    const boundary = parseFractionOrNumber(match[2]);

    if (boundary === null) {
        return null;
    }

    return {
        operator: match[1],
        boundary
    };
}

function parseCompoundInequalityAnswer(value) {
    const normalizedValue = String(value)
        .trim()
        .replace(/\s+/g, "")
        .replace(/≤/g, "<=")
        .replace(/≥/g, ">=");

    const match = normalizedValue.match(
        /^([+-]?\d+(?:\.\d+)?)<=x<=([+-]?\d+(?:\.\d+)?)$/
    );

    if (!match) {
        return null;
    }

    return {
        lower: Number(match[1]),
        upper: Number(match[2])
    };
}

function numberResult(userAnswer, expected, helpText) {
    const answer = parseFractionOrNumber(userAnswer);

    if (answer === null) {
        return {
            correct: false,
            message:
                "Please enter a number or fraction."
        };
    }

    if (numbersAreClose(answer, expected)) {
        return {
            correct: true,
            expectedAnswer:
                Number.isInteger(expected)
                    ? String(expected)
                    : formatFraction(
                        Math.round(expected * 1000000),
                        1000000
                    )
        };
    }

    return {
        correct: false,
        message: helpText
    };
}

function standardProblem(problemText, questionText, exampleText, extra = {}) {
    return {
        problemText,
        questionText,
        exampleText,
        ...extra
    };
}

function reverseInequality(operator) {
    const map = {
        "<": ">",
        ">": "<",
        "<=": ">=",
        ">=": "<="
    };

    return map[operator];
}

const algebraHelperFunctions = Object.freeze({
    randomInteger,
    randomNonZeroInteger,
    randomItem,
    greatestCommonDivisor,
    simplifyFraction,
    formatFraction,
    parseNumber,
    parseFractionOrNumber,
    numbersAreClose,
    normalizeExpression,
    formatCoefficient,
    formatLinearExpression,
    parseInequalityAnswer,
    parseCompoundInequalityAnswer,
    numberResult,
    standardProblem,
    reverseInequality,
    showCorrectFeedback,
    showIncorrectFeedback,
    clearFeedback
});

// ==================================================
// GENERATOR 01: Evaluate an expression
// ==================================================

registerAlgebraGenerator(1, {
    title: "Evaluate an expression",

    createProblem() {
        const x = randomInteger(-6, 8);
        const coefficient = randomNonZeroInteger(-8, 8);
        const constant = randomInteger(-10, 10);
        const result = coefficient * x + constant;

        return standardProblem(
            `${formatLinearExpression(coefficient, constant)} for x = ${x}`,
            "Evaluate the expression.",
            "Substitute the value of x, then simplify.",
            { result }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        return numberResult(
            userAnswer,
            problem.result,
            "Not quite. Substitute the given value for x and calculate."
        );
    }
});

// ==================================================
// GENERATOR 02: Combine like terms
// ==================================================

registerAlgebraGenerator(2, {
    title: "Combine like terms",

    createProblem() {
        const first = randomNonZeroInteger(-8, 8);
        const second = randomNonZeroInteger(-8, 8);
        const firstConstant = randomInteger(-10, 10);
        const secondConstant = randomInteger(-10, 10);
        const coefficient = first + second;
        const constant = firstConstant + secondConstant;

        return standardProblem(
            `${formatLinearExpression(first, firstConstant)} + ` +
            `(${formatLinearExpression(second, secondConstant)})`,
            "Combine like terms.",
            "Add the x-terms together and add the constants together.",
            {
                expected:
                    normalizeExpression(
                        formatLinearExpression(coefficient, constant)
                    )
            }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        const answer = normalizeExpression(userAnswer);

        if (!answer) {
            return {
                correct: false,
                message:
                    "Please enter a simplified algebraic expression."
            };
        }

        if (answer === problem.expected) {
            return {
                correct: true,
                expectedAnswer: problem.expected
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Combine the x-terms and constants separately."
        };
    }
});

// ==================================================
// GENERATOR 03: Expand brackets
// ==================================================

registerAlgebraGenerator(3, {
    title: "Expand brackets",

    createProblem() {
        const outside = randomNonZeroInteger(-6, 6);
        const coefficient = randomNonZeroInteger(-5, 5);
        const constant = randomInteger(-8, 8);
        const expandedCoefficient = outside * coefficient;
        const expandedConstant = outside * constant;

        return standardProblem(
            `${outside}(${formatLinearExpression(coefficient, constant)})`,
            "Expand the brackets.",
            "Multiply every term inside the brackets by the outside number.",
            {
                expected:
                    normalizeExpression(
                        formatLinearExpression(
                            expandedCoefficient,
                            expandedConstant
                        )
                    )
            }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        const answer = normalizeExpression(userAnswer);

        if (answer === problem.expected) {
            return {
                correct: true,
                expectedAnswer: problem.expected
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Multiply the outside number by every term inside the brackets."
        };
    }
});

// ==================================================
// GENERATOR 04: Factor out the greatest common factor
// ==================================================

registerAlgebraGenerator(4, {
    title: "Factor out the greatest common factor",

    createProblem() {
        const factor = randomInteger(2, 8);
        const first = randomNonZeroInteger(1, 8);
        const second = randomNonZeroInteger(-8, 8);
        const coefficient = factor * first;
        const constant = factor * second;

        return standardProblem(
            formatLinearExpression(coefficient, constant),
            "Factor out the greatest common factor.",
            "Find the greatest number that divides both terms.",
            {
                expectedOptions: [
                    normalizeExpression(
                        `${factor}(${formatLinearExpression(first, second)})`
                    ),
                    normalizeExpression(
                        `${-factor}(${formatLinearExpression(-first, -second)})`
                    )
                ],
                displayAnswer:
                    `${factor}(${formatLinearExpression(first, second)})`
            }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        const answer = normalizeExpression(userAnswer);

        if (problem.expectedOptions.includes(answer)) {
            return {
                correct: true,
                expectedAnswer: problem.displayAnswer
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Divide every term by the greatest common factor."
        };
    }
});

// ==================================================
// GENERATOR 05: One-step equations
// ==================================================

registerAlgebraGenerator(5, {
    title: "One-step equations",

    createProblem() {
        const solution = randomInteger(-12, 12);
        const type = randomItem(["add", "subtract", "multiply"]);

        if (type === "add") {
            const constant = randomInteger(-10, 10);
            return standardProblem(
                `x + ${constant} = ${solution + constant}`,
                "Solve for x.",
                "Undo the addition.",
                { solution }
            );
        }

        if (type === "subtract") {
            const constant = randomInteger(1, 10);
            return standardProblem(
                `x - ${constant} = ${solution - constant}`,
                "Solve for x.",
                "Undo the subtraction.",
                { solution }
            );
        }

        const coefficient = randomNonZeroInteger(-9, 9);

        return standardProblem(
            `${coefficient}x = ${coefficient * solution}`,
            "Solve for x.",
            "Divide both sides by the coefficient.",
            { solution }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        return numberResult(
            userAnswer,
            problem.solution,
            "Not quite. Use the inverse operation to isolate x."
        );
    }
});

// ==================================================
// GENERATOR 06: Two-step equations
// ==================================================

registerAlgebraGenerator(6, {
    title: "Two-step equations",

    createProblem() {
        const solution = randomInteger(-10, 10);
        const coefficient = randomNonZeroInteger(-8, 8);
        const constant = randomInteger(-12, 12);
        const result = coefficient * solution + constant;

        return standardProblem(
            `${formatLinearExpression(coefficient, constant)} = ${result}`,
            "Solve for x.",
            "Undo the constant first, then divide by the coefficient.",
            { solution }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        return numberResult(
            userAnswer,
            problem.solution,
            "Not quite. Undo the constant first, then divide by the coefficient."
        );
    }
});

// ==================================================
// GENERATOR 07: Variables on both sides
// ==================================================

registerAlgebraGenerator(7, {
    title: "Variables on both sides",

    createProblem() {
        const solution = randomInteger(-8, 8);
        let leftCoefficient = randomNonZeroInteger(-8, 8);
        let rightCoefficient = randomNonZeroInteger(-8, 8);

        while (leftCoefficient === rightCoefficient) {
            rightCoefficient = randomNonZeroInteger(-8, 8);
        }

        const leftConstant = randomInteger(-10, 10);
        const rightConstant =
            leftCoefficient * solution +
            leftConstant -
            rightCoefficient * solution;

        return standardProblem(
            `${formatLinearExpression(leftCoefficient, leftConstant)} = ` +
            `${formatLinearExpression(rightCoefficient, rightConstant)}`,
            "Solve for x.",
            "Move the x-terms to one side and constants to the other.",
            { solution }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        return numberResult(
            userAnswer,
            problem.solution,
            "Not quite. Collect the x-terms on one side and constants on the other."
        );
    }
});

// ==================================================
// GENERATOR 08: Equations with fractions
// ==================================================

registerAlgebraGenerator(8, {
    title: "Equations with fractions",

    createProblem() {
        const denominator = randomInteger(2, 8);
        const solution = randomInteger(-10, 10);
        const constant = randomInteger(-8, 8);
        const result = solution / denominator + constant;

        return standardProblem(
            `x/${denominator} ${constant >= 0 ? "+" : "-"} ` +
            `${Math.abs(constant)} = ${formatFraction(
                Math.round(result * denominator),
                denominator
            )}`,
            "Solve for x.",
            "Undo the constant, then multiply by the denominator.",
            { solution }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        return numberResult(
            userAnswer,
            problem.solution,
            "Not quite. Undo the constant, then multiply both sides by the denominator."
        );
    }
});

// ==================================================
// GENERATOR 09: One-step inequalities
// ==================================================

registerAlgebraGenerator(9, {
    title: "One-step inequalities",

    createProblem() {
        const boundary = randomInteger(-10, 10);
        const operator = randomItem(["<", ">", "<=", ">="]);
        const constant = randomInteger(-8, 8);
        const rightSide = boundary + constant;

        return standardProblem(
            `x + ${constant} ${operator} ${rightSide}`,
            "Solve the inequality. Enter an answer such as x < 4.",
            "Use the same inverse operation as with an equation.",
            { boundary, operator }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        const answer = parseInequalityAnswer(userAnswer);

        if (!answer) {
            return {
                correct: false,
                message:
                    "Please enter an inequality such as x < 4."
            };
        }

        if (
            answer.operator === problem.operator &&
            numbersAreClose(answer.boundary, problem.boundary)
        ) {
            return {
                correct: true,
                expectedAnswer:
                    `x ${problem.operator} ${problem.boundary}`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Isolate x using the inverse operation."
        };
    }
});

// ==================================================
// GENERATOR 10: Two-step inequalities
// ==================================================

registerAlgebraGenerator(10, {
    title: "Two-step inequalities",

    createProblem() {
        const boundary = randomInteger(-8, 8);
        const coefficient = randomItem([2, 3, 4, 5, -2, -3, -4, -5]);
        const constant = randomInteger(-10, 10);
        const baseOperator = randomItem(["<", ">", "<=", ">="]);
        const rightSide = coefficient * boundary + constant;
        const solutionOperator =
            coefficient < 0
                ? reverseInequality(baseOperator)
                : baseOperator;

        return standardProblem(
            `${formatLinearExpression(coefficient, constant)} ` +
            `${baseOperator} ${rightSide}`,
            "Solve the inequality. Enter an answer such as x ≥ 2.",
            "When dividing by a negative number, reverse the inequality sign.",
            {
                boundary,
                operator: solutionOperator
            }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        const answer = parseInequalityAnswer(userAnswer);

        if (!answer) {
            return {
                correct: false,
                message:
                    "Please enter an inequality such as x ≥ 2."
            };
        }

        if (
            answer.operator === problem.operator &&
            numbersAreClose(answer.boundary, problem.boundary)
        ) {
            return {
                correct: true,
                expectedAnswer:
                    `x ${problem.operator} ${problem.boundary}`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Isolate x and reverse the sign if you divide by a negative number."
        };
    }
});

// ==================================================
// GENERATOR 11: Compound inequalities
// ==================================================

registerAlgebraGenerator(11, {
    title: "Compound inequalities",

    createProblem() {
        const lower = randomInteger(-10, 2);
        const upper = randomInteger(lower + 2, 12);

        return standardProblem(
            `${lower - 3} ≤ x - 3 ≤ ${upper - 3}`,
            "Solve the compound inequality. Enter it like -2 ≤ x ≤ 5.",
            "Apply the same operation to all three parts.",
            { lower, upper }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        const answer = parseCompoundInequalityAnswer(userAnswer);

        if (!answer) {
            return {
                correct: false,
                message:
                    "Please enter a compound inequality such as -2 ≤ x ≤ 5."
            };
        }

        if (
            numbersAreClose(answer.lower, problem.lower) &&
            numbersAreClose(answer.upper, problem.upper)
        ) {
            return {
                correct: true,
                expectedAnswer:
                    `${problem.lower} ≤ x ≤ ${problem.upper}`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Apply the same operation to every part of the inequality."
        };
    }
});

// ==================================================
// GENERATOR 12: Word problems with inequalities
// ==================================================

registerAlgebraGenerator(12, {
    title: "Word problems with inequalities",

    createProblem() {
        const minimum = randomInteger(4, 12);
        const startingAmount = randomInteger(1, minimum - 1);
        const needed = minimum - startingAmount;

        return standardProblem(
            `Mia has ${startingAmount} points and needs at least ${minimum} points.`,
            "How many more points x does she need? Enter an inequality.",
            "At least means ≥.",
            {
                boundary: needed,
                operator: ">="
            }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        const answer = parseInequalityAnswer(userAnswer);

        if (!answer) {
            return {
                correct: false,
                message:
                    "Please enter an inequality such as x ≥ 4."
            };
        }

        if (
            answer.operator === problem.operator &&
            numbersAreClose(answer.boundary, problem.boundary)
        ) {
            return {
                correct: true,
                expectedAnswer:
                    `x ≥ ${problem.boundary}`
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Translate “at least” as ≥ and find the missing amount."
        };
    }
});

// ==================================================
// GENERATOR 13: Evaluate a function
// ==================================================

registerAlgebraGenerator(13, {
    title: "Evaluate a function",

    createProblem() {
        const coefficient = randomNonZeroInteger(-7, 7);
        const constant = randomInteger(-10, 10);
        const x = randomInteger(-6, 8);
        const result = coefficient * x + constant;

        return standardProblem(
            `f(x) = ${formatLinearExpression(coefficient, constant)}, x = ${x}`,
            "Find f(x).",
            "Substitute the given value of x.",
            { result }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        return numberResult(
            userAnswer,
            problem.result,
            "Not quite. Substitute the given x-value into the function."
        );
    }
});

// ==================================================
// GENERATOR 14: Find the missing function value
// ==================================================

registerAlgebraGenerator(14, {
    title: "Find the missing function value",

    createProblem() {
        const coefficient = randomNonZeroInteger(-7, 7);
        const constant = randomInteger(-10, 10);
        const x = randomInteger(-6, 8);
        const output = coefficient * x + constant;

        return standardProblem(
            `f(x) = ${formatLinearExpression(coefficient, constant)}, f(x) = ${output}`,
            "Find x.",
            "Set the function equal to the given output and solve.",
            { solution: x }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        return numberResult(
            userAnswer,
            problem.solution,
            "Not quite. Set the function equal to the output and solve for x."
        );
    }
});

// ==================================================
// GENERATOR 15: Slope from two points
// ==================================================

registerAlgebraGenerator(15, {
    title: "Slope from two points",

    createProblem() {
        const x1 = randomInteger(-5, 3);
        const x2 = randomInteger(x1 + 1, x1 + 6);
        const slope = randomNonZeroInteger(-5, 5);
        const y1 = randomInteger(-8, 8);
        const y2 = y1 + slope * (x2 - x1);

        return standardProblem(
            `(${x1}, ${y1}) and (${x2}, ${y2})`,
            "Find the slope.",
            "Slope = change in y ÷ change in x.",
            { slope }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        return numberResult(
            userAnswer,
            problem.slope,
            "Not quite. Subtract the y-values and divide by the difference in x-values."
        );
    }
});

// ==================================================
// GENERATOR 16: Slope-intercept form
// ==================================================

registerAlgebraGenerator(16, {
    title: "Slope-intercept form",

    createProblem() {
        const slope = randomNonZeroInteger(-6, 6);
        const intercept = randomInteger(-10, 10);
        const expected =
            normalizeExpression(
                `y=${formatLinearExpression(slope, intercept)}`
            );

        return standardProblem(
            `Slope m = ${slope}, y-intercept b = ${intercept}`,
            "Write the equation in slope-intercept form.",
            "Use y = mx + b.",
            {
                expected,
                displayAnswer:
                    `y = ${formatLinearExpression(slope, intercept)}`
            }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        const answer = normalizeExpression(userAnswer);

        if (answer === problem.expected) {
            return {
                correct: true,
                expectedAnswer: problem.displayAnswer
            };
        }

        return {
            correct: false,
            message:
                "Not quite. Substitute the slope and y-intercept into y = mx + b."
        };
    }
});

// ==================================================
// GENERATOR 17: Word equations
// ==================================================

registerAlgebraGenerator(17, {
    title: "Word equations",

    createProblem() {
        const solution = randomInteger(2, 20);
        const multiplier = randomInteger(2, 8);
        const addition = randomInteger(1, 12);
        const result = multiplier * solution + addition;

        return standardProblem(
            `${multiplier} times a number plus ${addition} equals ${result}.`,
            "Find the number.",
            "Translate the sentence into an equation, then solve.",
            { solution }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        return numberResult(
            userAnswer,
            problem.solution,
            "Not quite. Translate the words into an equation and isolate the unknown."
        );
    }
});

// ==================================================
// GENERATOR 18: Consecutive number problems
// ==================================================

registerAlgebraGenerator(18, {
    title: "Consecutive number problems",

    createProblem() {
        const first = randomInteger(-10, 15);
        const second = first + 1;
        const sum = first + second;

        return standardProblem(
            `Two consecutive integers have a sum of ${sum}.`,
            "Enter the smaller integer.",
            "Let the smaller integer be x and the next integer be x + 1.",
            { solution: first }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        return numberResult(
            userAnswer,
            problem.solution,
            "Not quite. Use x and x + 1, then solve their sum."
        );
    }
});

// ==================================================
// GENERATOR 19: Formula rearrangement
// ==================================================

registerAlgebraGenerator(19, {
    title: "Formula rearrangement",

    createProblem() {
        const type = randomItem(["distance", "area"]);

        if (type === "distance") {
            const rate = randomInteger(2, 12);
            const time = randomInteger(2, 10);
            const distance = rate * time;

            return standardProblem(
                `d = rt, d = ${distance}, r = ${rate}`,
                "Find t.",
                "Divide both sides by r.",
                { solution: time }
            );
        }

        const width = randomInteger(2, 12);
        const height = randomInteger(2, 10);
        const area = width * height;

        return standardProblem(
            `A = wh, A = ${area}, w = ${width}`,
            "Find h.",
            "Divide both sides by w.",
            { solution: height }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        return numberResult(
            userAnswer,
            problem.solution,
            "Not quite. Rearrange the formula by dividing by the known multiplier."
        );
    }
});

// ==================================================
// GENERATOR 20: Mixed algebra word problems
// ==================================================

registerAlgebraGenerator(20, {
    title: "Mixed algebra word problems",

    createProblem() {
        const type = randomItem([
            "taxi",
            "rectangle",
            "tickets"
        ]);

        if (type === "taxi") {
            const startFee = randomInteger(2, 8);
            const perMile = randomInteger(2, 6);
            const miles = randomInteger(2, 12);
            const total = startFee + perMile * miles;

            return standardProblem(
                `A taxi costs $${startFee} plus $${perMile} per mile. The total was $${total}.`,
                "How many miles were traveled?",
                "Subtract the start fee, then divide by the price per mile.",
                { solution: miles }
            );
        }

        if (type === "rectangle") {
            const width = randomInteger(2, 12);
            const length = width + randomInteger(2, 8);
            const perimeter = 2 * width + 2 * length;

            return standardProblem(
                `A rectangle has width x and length x + ${length - width}. Its perimeter is ${perimeter}.`,
                "Find x.",
                "Use P = 2w + 2l.",
                { solution: width }
            );
        }

        const adultPrice = randomInteger(6, 12);
        const childPrice = randomInteger(2, adultPrice - 1);
        const childTickets = randomInteger(2, 8);
        const adultTickets = randomInteger(2, 8);
        const total =
            adultPrice * adultTickets +
            childPrice * childTickets;

        return standardProblem(
            `${adultTickets} adult tickets cost $${adultPrice} each. ` +
            `${childTickets} child tickets and all adult tickets cost $${total}.`,
            "What is the price of one child ticket?",
            "Subtract the adult-ticket total, then divide by the number of child tickets.",
            { solution: childPrice }
        );
    },

    checkAnswer({ userAnswer, problem }) {
        return numberResult(
            userAnswer,
            problem.solution,
            "Not quite. Translate the situation into an equation and isolate the unknown."
        );
    }
});

// ==================================================
// ENDE DER DATEI
// ==================================================
