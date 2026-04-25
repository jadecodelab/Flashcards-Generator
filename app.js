const STORAGE_KEY = "flashcards-app-saved-decks";

const appHeader = document.getElementById("appHeader");
const generateBtn = document.getElementById("generateBtn");
const notesInput = document.getElementById("notes");
const topicInput = document.getElementById("topic");
const fileUpload = document.getElementById("fileUpload");
const statusMessage = document.getElementById("statusMessage");
const cardCountInput = document.getElementById("cardCount");
const difficultyInput = document.getElementById("difficulty");
const saveDeckBtn = document.getElementById("saveDeckBtn");
const shuffleDeckBtn = document.getElementById("shuffleDeckBtn");
const savedDecksList = document.getElementById("savedDecksList");
const tabSavedBtn = document.getElementById("tabSaved");
const backToCreateLink = document.getElementById("backToCreateLink");
const backToCreateBtn = document.getElementById("backToCreateBtn");
const createView = document.getElementById("createView");
const savedView = document.getElementById("savedView");
const createPanel = document.getElementById("createPanel");
const reviewView = document.getElementById("reviewView");
const reviewDeckTitle = document.getElementById("reviewDeckTitle");
const reviewDeckMeta = document.getElementById("reviewDeckMeta");
const reviewEmptyState = document.getElementById("reviewEmptyState");
const reviewCardArea = document.getElementById("reviewCardArea");
const reviewProgress = document.getElementById("reviewProgress");
const reviewQuestion = document.getElementById("reviewQuestion");
const reviewAnswer = document.getElementById("reviewAnswer");
const reviewCard = document.getElementById("reviewCard");
const prevCardBtn = document.getElementById("prevCardBtn");
const nextCardBtn = document.getElementById("nextCardBtn");
const questionList = document.getElementById("questionList");

let currentFlashcards = [];
let savedDecks = loadSavedDecks();
let activeTab = "create";
let currentReviewIndex = 0;

function switchTab(nextTab) {
  activeTab = nextTab;
  if (tabSavedBtn) {
    const savedActive = nextTab === "saved";
    tabSavedBtn.classList.toggle("active", savedActive);
    tabSavedBtn.setAttribute("aria-pressed", String(savedActive));
  }
  createView.classList.toggle("active", nextTab === "create");
  savedView.classList.toggle("active", nextTab === "saved");
}

function showCreateMode() {
  createPanel.classList.remove("hidden");
  reviewView.classList.add("hidden");
  appHeader.classList.remove("compact");
}

function showReviewMode() {
  createPanel.classList.add("hidden");
  reviewView.classList.remove("hidden");
  appHeader.classList.add("compact");
}

function setStatus(message, isError = false) {
  if (!message) {
    statusMessage.textContent = "";
    statusMessage.className = "status hidden";
    return;
  }
  statusMessage.textContent = message;
  statusMessage.className = isError ? "status error" : "status";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function loadSavedDecks() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSavedDecks() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDecks));
}

function formatSavedDate(value) {
  return new Date(value).toLocaleString();
}

function createFallbackDeckName() {
  const base = topicInput.value.trim() || "Study Deck";
  const matchingDecks = savedDecks.filter((deck) => deck.title === base || deck.title.startsWith(`${base} (`));
  if (!matchingDecks.length) {
    return base;
  }
  return `${base} (${matchingDecks.length + 1})`;
}

function currentDeckTitle() {
  return topicInput.value.trim();
}

function updateActionButtons() {
  const hasCards = currentFlashcards.length > 0;
  saveDeckBtn.classList.toggle("hidden", !hasCards);
  shuffleDeckBtn.classList.toggle("hidden", !hasCards);
}

function updateQuestionList() {
  questionList.innerHTML = "";
  if (!currentFlashcards.length) {
    questionList.innerHTML = '<div class="empty-state">Questions will appear here once a deck is loaded.</div>';
    return;
  }

  currentFlashcards.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `question-jump-btn${index === currentReviewIndex ? " active" : ""}`;
    button.textContent = `${index + 1}. ${card.question}`;
    button.addEventListener("click", () => {
      currentReviewIndex = index;
      renderReviewCard();
    });
    questionList.appendChild(button);
  });
}

function updateReviewHeader() {
  if (!currentFlashcards.length) {
    reviewDeckTitle.textContent = "No deck loaded yet";
    reviewDeckMeta.textContent = "Generate a deck or open a saved one to start reviewing.";
    return;
  }
  reviewDeckTitle.textContent = currentDeckTitle();
  reviewDeckMeta.textContent = `${currentFlashcards.length} cards • ${difficultyInput.value}`;
}

function renderReviewCard() {
  updateReviewHeader();
  updateQuestionList();

  if (!currentFlashcards.length) {
    reviewEmptyState.classList.remove("hidden");
    reviewCardArea.classList.add("hidden");
    return;
  }

  const card = currentFlashcards[currentReviewIndex] || currentFlashcards[0];
  reviewEmptyState.classList.add("hidden");
  reviewCardArea.classList.remove("hidden");
  reviewProgress.textContent = `Card ${currentReviewIndex + 1} of ${currentFlashcards.length}`;
  reviewQuestion.textContent = card.question;
  reviewAnswer.textContent = card.answer;
  reviewAnswer.classList.add("hidden");
  prevCardBtn.disabled = currentReviewIndex === 0;
  nextCardBtn.disabled = currentReviewIndex === currentFlashcards.length - 1;
}

function renderSavedDecks() {
  savedDecksList.innerHTML = "";
  if (!savedDecks.length) {
    savedDecksList.innerHTML = '<div class="empty-state">No saved decks yet.</div>';
    return;
  }

  savedDecks.forEach((deck) => {
    const deckElement = document.createElement("article");
    deckElement.className = "saved-deck-card";
    deckElement.innerHTML = `
      <div class="saved-deck-main">
        <div class="saved-deck-head">
          <div>
            <div class="saved-deck-title-row">
              <div class="saved-deck-title">${escapeHtml(deck.title)}</div>
              <span class="saved-deck-count">${deck.flashcards.length} cards</span>
            </div>
            <p class="saved-deck-meta">${escapeHtml(deck.difficulty)} • Saved ${escapeHtml(formatSavedDate(deck.savedAt))}</p>
          </div>
        </div>
        <div class="saved-deck-actions">
          <button type="button" class="deck-open-btn">Open</button>
          <button type="button" class="deck-delete-btn">Delete</button>
        </div>
      </div>
    `;

    deckElement.querySelector(".deck-open-btn").addEventListener("click", () => {
      topicInput.value = deck.topic || "";
      notesInput.value = deck.notes || "";
      cardCountInput.value = String(deck.cardCount || 6);
      difficultyInput.value = deck.difficulty || "medium";
      fileUpload.value = "";
      currentReviewIndex = 0;
      renderFlashcards(deck.flashcards);
      switchTab("create");
      showReviewMode();
      setStatus(`Opened saved deck "${deck.title}".`);
    });

    deckElement.querySelector(".deck-delete-btn").addEventListener("click", () => {
      if (!window.confirm(`Delete saved deck "${deck.title}"?`)) {
        return;
      }
      savedDecks = savedDecks.filter((savedDeck) => savedDeck.id !== deck.id);
      persistSavedDecks();
      renderSavedDecks();
      setStatus("Saved deck deleted.");
    });

    savedDecksList.appendChild(deckElement);
  });
}

function renderFlashcards(cards) {
  currentFlashcards = cards.map((card) => ({ ...card }));
  updateActionButtons();
  renderReviewCard();
}

function saveCurrentDeck() {
  if (!currentFlashcards.length) {
    setStatus("Generate or open a deck before saving.", true);
    return;
  }

  const title = createFallbackDeckName();
  const deck = {
    id: crypto.randomUUID(),
    title,
    topic: topicInput.value.trim(),
    notes: notesInput.value,
    cardCount: Number.parseInt(cardCountInput.value, 10),
    difficulty: difficultyInput.value,
    flashcards: currentFlashcards.map((card) => ({ ...card })),
    savedAt: new Date().toISOString()
  };

  savedDecks.unshift(deck);
  persistSavedDecks();
  renderSavedDecks();
  switchTab("saved");
  setStatus(`Saved deck "${title}".`);
}

function toggleReviewAnswer() {
  if (!currentFlashcards.length) {
    return;
  }
  reviewAnswer.classList.toggle("hidden");
}

function shuffleCurrentDeck() {
  if (currentFlashcards.length < 2) {
    return;
  }

  const shuffled = [...currentFlashcards];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  currentReviewIndex = 0;
  renderFlashcards(shuffled);
  setStatus("Deck shuffled.");
}

function resetForCreate() {
  showCreateMode();
  switchTab("create");
  setStatus("");
}

fileUpload.addEventListener("change", () => {
  const file = fileUpload.files[0];
  if (!file) {
    return;
  }

  const textLikeTypes = ["text/plain", "text/markdown", "text/csv", ""];
  const looksTextLike = textLikeTypes.includes(file.type) || /\.(txt|md|csv)$/i.test(file.name);
  const looksDocx = /\.docx$/i.test(file.name) || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (looksTextLike) {
    const reader = new FileReader();
    reader.onload = () => {
      notesInput.value = String(reader.result || "");
      currentFlashcards = [];
      currentReviewIndex = 0;
      updateActionButtons();
      renderReviewCard();
      resetForCreate();
      setStatus(`Loaded notes from ${file.name}.`);
    };
    reader.onerror = () => {
      setStatus("Could not read that file. Try a plain text file.", true);
    };
    reader.readAsText(file);
    return;
  }

  if (looksDocx) {
    currentFlashcards = [];
    currentReviewIndex = 0;
    updateActionButtons();
    renderReviewCard();
    resetForCreate();
    setStatus(`Loaded Word document ${file.name}. The server will extract the text when you generate flashcards.`);
    return;
  }

  setStatus("Upload a .txt, .md, .csv, or .docx file.", true);
});

if (tabSavedBtn) {
  tabSavedBtn.addEventListener("click", () => {
    switchTab("saved");
  });
}

if (backToCreateLink) {
  backToCreateLink.addEventListener("click", resetForCreate);
}

if (backToCreateBtn) {
  backToCreateBtn.addEventListener("click", resetForCreate);
}

saveDeckBtn.addEventListener("click", saveCurrentDeck);
shuffleDeckBtn.addEventListener("click", shuffleCurrentDeck);
reviewCard.addEventListener("click", toggleReviewAnswer);
prevCardBtn.addEventListener("click", () => {
  if (currentReviewIndex > 0) {
    currentReviewIndex -= 1;
    renderReviewCard();
  }
});
nextCardBtn.addEventListener("click", () => {
  if (currentReviewIndex < currentFlashcards.length - 1) {
    currentReviewIndex += 1;
    renderReviewCard();
  }
});

document.addEventListener("keydown", (event) => {
  if (activeTab !== "create" || reviewView.classList.contains("hidden") || !currentFlashcards.length) {
    return;
  }

  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return;
  }

  if (event.key === "ArrowLeft" && currentReviewIndex > 0) {
    currentReviewIndex -= 1;
    renderReviewCard();
  }

  if (event.key === "ArrowRight" && currentReviewIndex < currentFlashcards.length - 1) {
    currentReviewIndex += 1;
    renderReviewCard();
  }

  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    toggleReviewAnswer();
  }
});

generateBtn.addEventListener("click", async () => {
  const notes = notesInput.value.trim();
  const topic = topicInput.value.trim();
  const file = fileUpload.files[0];
  const cardCount = cardCountInput.value;
  const difficulty = difficultyInput.value;

  if (!topic) {
    setStatus("Add a topic before generating flashcards.", true);
    topicInput.focus();
    return;
  }

  if (!notes && !file) {
    currentFlashcards = [];
    currentReviewIndex = 0;
    updateActionButtons();
    renderReviewCard();
    setStatus("Paste notes or upload a file first.", true);
    return;
  }

  generateBtn.disabled = true;
  currentFlashcards = [];
  currentReviewIndex = 0;
  updateActionButtons();
  renderReviewCard();
  setStatus(`Generating ${cardCount} ${difficulty} flashcards...`);

  try {
    const formData = new FormData();
    formData.append("notes", notes);
    formData.append("topic", topic);
    formData.append("cardCount", cardCount);
    formData.append("difficulty", difficulty);
    if (file) {
      formData.append("file", file);
    }

    const response = await fetch("/api/generate-flashcards", { method: "POST", body: formData });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    renderFlashcards(data.flashcards);
    switchTab("create");
    showReviewMode();
    setStatus(`Generated ${data.flashcards.length} ${difficulty} flashcards.`);
  } catch (error) {
    setStatus(error.message || "Could not generate flashcards.", true);
  } finally {
    generateBtn.disabled = false;
  }
});

renderSavedDecks();
updateActionButtons();
renderReviewCard();
switchTab(activeTab);
showCreateMode();
setStatus("");

