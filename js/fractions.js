/*
  THE MATH FINAL GIRL
  Fractions practice system

  Generator 1 active:
  Identify the fraction
*/

"use strict";

const fractionTopics = [
  { id: "understanding", title: "Understanding Fractions" },
  { id: "comparing", title: "Comparing & Ordering" },
  { id: "addition-subtraction", title: "Addition & Subtraction" },
  { id: "multiplication-division", title: "Multiplication & Division" },
  { id: "mixed-applications", title: "Mixed Numbers & Applications" },
  { id: "mixed-practice", title: "Mixed Practice" }
];

const fractionExercises = [
  { id: "identify-fraction", title: "Identify the fraction", topic: "understanding", enabled: true, generate: generateIdentifyFractionProblem },
  { id: "numerator-denominator", title: "Numerator or denominator", topic: "understanding", enabled: false },
  { id: "equivalent-fractions", title: "Equivalent fractions", topic: "understanding", enabled: false },
  { id: "simplify-fraction", title: "Simplify a fraction", topic: "understanding", enabled: false },
  { id: "compare-same-denominator", title: "Compare: same denominator", topic: "comparing", enabled: false },
  { id: "compare-same-numerator", title: "Compare: same numerator", topic: "comparing", enabled: false },
  { id: "compare-different", title: "Compare: different fractions", topic: "comparing", enabled: false },
  { id: "order-three", title: "Order three fractions", topic: "comparing", enabled: false },
  { id: "add-same-denominator", title: "Add: same denominator", topic: "addition-subtraction", enabled: false },
  { id: "subtract-same-denominator", title: "Subtract: same denominator", topic: "addition-subtraction", enabled: false },
  { id: "add-different-denominators", title: "Add: different denominators", topic: "addition-subtraction", enabled: false },
  { id: "subtract-different-denominators", title: "Subtract: different denominators", topic: "addition-subtraction", enabled: false },
  { id: "add-three-fractions", title: "Add three fractions", topic: "addition-subtraction", enabled: false },
  { id: "multiply-whole-fraction", title: "Whole number × fraction", topic: "multiplication-division", enabled: false },
  { id: "multiply-two-fractions", title: "Multiply two fractions", topic: "multiplication-division", enabled: false },
  { id: "divide-fraction-whole", title: "Fraction ÷ whole number", topic: "multiplication-division", enabled: false },
  { id: "divide-two-fractions", title: "Divide two fractions", topic: "multiplication-division", enabled: false },
  { id: "improper-to-mixed", title: "Improper fraction → mixed number", topic: "mixed-applications", enabled: false },
  { id: "mixed-to-improper", title: "Mixed number → improper fraction", topic: "mixed-applications", enabled: false },
  { id: "fraction-of-quantity", title: "Fraction of a quantity", topic: "mixed-applications", enabled: false }
];

let currentTopicId = null;
let currentExercise = null;
let currentProblem = null;

const topicButtonsElement = document.getElementById("topicButtons");
const exercisePanelElement = document.getElementById("exercisePanel");
const exerciseHeadingElement = document.getElementById("exerciseHeading");
const exerciseButtonsElement = document.getElementById("exerciseButtons");
const practiceAreaElement = document.getElementById("practiceArea");
const practiceTitleElement = document.getElementById("practiceTitle");
const problemElement = document.getElementById("problem");
const answerInputElement = document.getElementById("answerInput");
const checkButtonElement = document.getElementById("checkButton");
const newProblemButtonElement = document.getElementById("newProblemButton");
const feedbackElement = document.getElementById("feedback");

function initialiseFractionsPage() {
  renderTopicButtons();
  checkButtonElement.addEventListener("click", checkCurrentAnswer);
  newProblemButtonElement.addEventListener("click", generateCurrentProblem);
  answerInputElement.addEventListener("keydown", event => {
    if (event.key === "Enter") checkCurrentAnswer();
  });
}

function renderTopicButtons() {
  topicButtonsElement.innerHTML = "";
  fractionTopics.forEach(topic => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "topic-button";
    button.textContent = topic.title;
    button.dataset.topicId = topic.id;
    button.addEventListener("click", () => selectTopic(topic.id));
    topicButtonsElement.appendChild(button);
  });
}

function selectTopic(topicId) {
  currentTopicId = topicId;
  currentExercise = null;
  currentProblem = null;
  document.querySelectorAll(".topic-button").forEach(button => {
    button.classList.toggle("active", button.dataset.topicId === topicId);
  });
  practiceAreaElement.style.display = "none";
  feedbackElement.textContent = "";
  answerInputElement.value = "";
  if (topicId === "mixed-practice") {
    renderMixedPracticeButton();
    return;
  }
  const topic = fractionTopics.find(item => item.id === topicId);
  exerciseHeadingElement.textContent = topic ? topic.title : "Choose an exercise";
  renderExerciseButtons(topicId);
  exercisePanelElement.hidden = false;
  exercisePanelElement.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderExerciseButtons(topicId) {
  exerciseButtonsElement.innerHTML = "";
  const exercises = fractionExercises.filter(exercise => exercise.topic === topicId);
  exercises.forEach(exercise => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "exercise-button";
    button.textContent = exercise.title;
    button.disabled = !exercise.enabled;
    button.dataset.exerciseId = exercise.id;
    if (exercise.enabled) button.addEventListener("click", () => selectExercise(exercise.id));
    exerciseButtonsElement.appendChild(button);
  });
}

function renderMixedPracticeButton() {
  exerciseHeadingElement.textContent = "Mixed Practice";
  exerciseButtonsElement.innerHTML = "";
  const enabledExercises = fractionExercises.filter(exercise => exercise.enabled && typeof exercise.generate === "function");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "exercise-button";
  button.textContent = enabledExercises.length > 0 ? "Start mixed practice" : "Mixed practice will unlock after the first generator is added.";
  button.disabled = enabledExercises.length === 0;
  if (enabledExercises.length > 0) button.addEventListener("click", startMixedPractice);
  exerciseButtonsElement.appendChild(button);
  exercisePanelElement.hidden = false;
  exercisePanelElement.scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectExercise(exerciseId) {
  const exercise = fractionExercises.find(item => item.id === exerciseId);
  if (!exercise || !exercise.enabled || typeof exercise.generate !== "function") return;
  currentExercise = exercise;
  document.querySelectorAll(".exercise-button").forEach(button => {
    button.classList.toggle("active", button.dataset.exerciseId === exerciseId);
  });
  practiceTitleElement.textContent = exercise.title;
  practiceAreaElement.style.display = "block";
  generateCurrentProblem();
  practiceAreaElement.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startMixedPractice() {
  const enabledExercises = fractionExercises.filter(exercise => exercise.enabled && typeof exercise.generate === "function");
  if (enabledExercises.length === 0) return;
  currentExercise = enabledExercises[randomInteger(0, enabledExercises.length - 1)];
  practiceTitleElement.textContent = "Mixed Practice";
  practiceAreaElement.style.display = "block";
  generateCurrentProblem();
  practiceAreaElement.scrollIntoView({ behavior: "smooth", block: "start" });
}

function generateCurrentProblem() {
  if (!currentExercise || typeof currentExercise.generate !== "function") {
    problemElement.textContent = "This exercise is not active yet.";
    return;
  }
  if (currentTopicId === "mixed-practice") {
    const enabledExercises = fractionExercises.filter(exercise => exercise.enabled && typeof exercise.generate === "function");
    if (enabledExercises.length === 0) return;
    currentExercise = enabledExercises[randomInteger(0, enabledExercises.length - 1)];
  }
  currentProblem = currentExercise.generate();
  problemElement.innerHTML = currentProblem.questionHtml;
  answerInputElement.value = "";
  feedbackElement.textContent = "";
  feedbackElement.className = "feedback";
  answerInputElement.focus();
}

function checkCurrentAnswer() {
  if (!currentProblem) {
    feedbackElement.textContent = "Choose an active exercise first.";
    feedbackElement.className = "feedback wrong";
    return;
  }
  const userAnswer = answerInputElement.value.trim();
  if (userAnswer === "") {
    feedbackElement.textContent = "Enter an answer first.";
    feedbackElement.className = "feedback wrong";
    return;
  }
  const result = currentProblem.checkAnswer(userAnswer);
  feedbackElement.textContent = result.message || (result.correct ? "Correct." : "Not quite. Try again.");
  feedbackElement.className = result.correct ? "feedback correct" : "feedback wrong";
}

function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function greatestCommonDivisor(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const remainder = x % y;
    x = y;
    y = remainder;
  }
  return x;
}

function simplifyFraction(numerator, denominator) {
  if (denominator === 0) throw new Error("A fraction cannot have a denominator of zero.");
  const sign = denominator < 0 ? -1 : 1;
  const adjustedNumerator = numerator * sign;
  const adjustedDenominator = denominator * sign;
  const divisor = greatestCommonDivisor(adjustedNumerator, adjustedDenominator);
  return { numerator: adjustedNumerator / divisor, denominator: adjustedDenominator / divisor };
}

function parseFractionAnswer(value) {
  const cleaned = value.replace(",", ".").trim();
  if (/^-?\d+\s*\/\s*-?\d+$/.test(cleaned)) {
    const parts = cleaned.split("/");
    const numerator = Number(parts[0].trim());
    const denominator = Number(parts[1].trim());
    if (denominator === 0) return null;
    return numerator / denominator;
  }
  if (/^-?(?:\d+\.?\d*|\.\d+)$/.test(cleaned)) return Number(cleaned);
  return null;
}

function numbersAreEqual(a, b, tolerance = 0.0000001) {
  return Math.abs(a - b) < tolerance;
}

function generateIdentifyFractionProblem() {
  const totalParts = randomInteger(4, 10);
  const shadedParts = randomInteger(1, totalParts - 1);
  const columns = totalParts <= 5 ? totalParts : Math.ceil(totalParts / 2);
  let blocksHtml = "";
  for (let index = 0; index < totalParts; index += 1) {
    const shadedClass = index < shadedParts ? " shaded" : "";
    blocksHtml += `<span class="fraction-block${shadedClass}" aria-hidden="true"></span>`;
  }
  const correctValue = shadedParts / totalParts;
  const simplified = simplifyFraction(shadedParts, totalParts);
  return {
    questionHtml: `
      <div class="fraction-visual">
        <div class="fraction-blocks" style="grid-template-columns: repeat(${columns}, minmax(0, 54px));" aria-label="${shadedParts} of ${totalParts} parts are shaded">
          ${blocksHtml}
        </div>
        <div class="fraction-question">What fraction is shaded?</div>
      </div>
    `,
    checkAnswer(userAnswer) {
      const parsedAnswer = parseFractionAnswer(userAnswer);
      const isCorrect = parsedAnswer !== null && numbersAreEqual(parsedAnswer, correctValue);
      if (isCorrect) {
        return { correct: true, message: `Correct. Simplified answer: ${simplified.numerator}/${simplified.denominator}` };
      }
      return { correct: false, message: "Not quite. Count the shaded parts and then count all parts." };
    }
  };
}

initialiseFractionsPage();
