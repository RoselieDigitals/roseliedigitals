// ==== Responsive Layout ====

// Add responsive CSS via JS (so you don't edit your CSS file)
const style = document.createElement('style');
style.innerHTML = `
@media (max-width: 900px) {
  #sidebar {
    position: fixed;
    left: -200px;
    top: 0; z-index: 100;
    width: 200px !important;
    height: 100vh;
    background: rgba(0,0,0,0.95);
    transition: left 0.3s;
    float: none;
  }
  #sidebar.open {
    left: 0;
  }
  #mainContent {
    margin-left: 0 !important;
    width: 100vw !important;
    padding: 12vw 4vw 4vw 4vw !important;
  }
  #menuToggleBtn {
    display: block !important;
    position: fixed;
    left: 10px; top: 10px; z-index: 200;
    background: rgba(0,0,0,0.7);
    color: #fff; border: none;
    font-size: 2em;
    border-radius: 5px;
    padding: 6px 15px;
    cursor: pointer;
  }
}
@media (min-width: 900px) {
  #menuToggleBtn { display: none !important; }
}
`;
document.head.appendChild(style);

// ==== Toggleable Sidebar ====
function addMenuToggle() {
  if (!document.getElementById('menuToggleBtn')) {
    const btn = document.createElement('button');
    btn.id = 'menuToggleBtn';
    btn.innerHTML = '&#9776;'; // hamburger
    btn.onclick = function() {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('open');
    };
    document.body.appendChild(btn);
  }
  // Always ensure sidebar reacts to clicks outside
  document.addEventListener('click', function(e) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;
    if (window.innerWidth >= 900) sidebar.classList.remove('open');
    if (window.innerWidth < 900 && sidebar.classList.contains('open')) {
      if (
        !sidebar.contains(e.target) &&
        e.target.id !== 'menuToggleBtn'
      ) {
        sidebar.classList.remove('open');
      }
    }
  });
}

// Patch showHome to call addMenuToggle after rendering
const _origShowHome = window.showHome;
window.showHome = function() {
  _origShowHome();
  setTimeout(addMenuToggle, 100);
};

// ==== Persistent Login ====
// Save login state to localStorage after login
const _origLoginUser = window.loginUser;
window.loginUser = function() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  const found = window.users.find(u => u.email === email && u.pass === pass);
  if (found) {
    window.currentUser = found;
    localStorage.setItem('lms_currentUser', JSON.stringify(found));
    window.showHome();
  } else {
    alert("Invalid email or password");
  }
};
// Save after signup as well
const _origSignupUser = window.signupUser;
window.signupUser = function() {
  _origSignupUser();
  const last = window.users[window.users.length - 1];
  if (last) {
    localStorage.setItem('lms_users', JSON.stringify(window.users));
    localStorage.setItem('lms_currentUser', JSON.stringify(last));
  }
};

// On load, restore users, lessons, feedbacks, and currentUser
function restoreFromStorage() {
  try {
    window.users = JSON.parse(localStorage.getItem('lms_users')) || [];
    window.lessons = JSON.parse(localStorage.getItem('lessons')) || [];
    window.feedbacks = JSON.parse(localStorage.getItem('lms_feedbacks')) || [];
    window.currentUser = JSON.parse(localStorage.getItem('lms_currentUser')) || null;
    if (!Array.isArray(window.users)) window.users = [];
    if (!Array.isArray(window.lessons)) window.lessons = [];
    if (!Array.isArray(window.feedbacks)) window.feedbacks = [];
  } catch(e) {
    window.users = [];
    window.lessons = [];
    window.feedbacks = [];
    window.currentUser = null;
  }
}
restoreFromStorage();

// On load, direct logged-in users to home
document.addEventListener('DOMContentLoaded', () => {
  restoreFromStorage();
  if (window.currentUser) {
    window.showHome();
  }
});

// On logout, remove currentUser from storage
const _origShowLogin = window.showLogin;
window.showLogin = function() {
  localStorage.removeItem('lms_currentUser');
  _origShowLogin();
};

// ==== Sync Lessons, Feedback, Comments, All Data for All Users ====
// Patch all data changing functions to update localStorage and reload data

function syncAll() {
  // Save everything to storage
  localStorage.setItem('lms_users', JSON.stringify(window.users));
  localStorage.setItem('lessons', JSON.stringify(window.lessons));
  localStorage.setItem('lms_feedbacks', JSON.stringify(window.feedbacks));
  // Optionally, update currentUser snapshot
  if (window.currentUser) {
    const updatedUser = window.users.find(u => u.email === window.currentUser.email);
    if (updatedUser) {
      window.currentUser = updatedUser;
      localStorage.setItem('lms_currentUser', JSON.stringify(updatedUser));
    }
  }
}

// Patch addLesson to sync to all students
const _origAddLesson = window.addLesson;
window.addLesson = function() {
  const name = document.getElementById('lessonName').value;
  const description = document.getElementById('lessonDesc').value;
  const url = document.getElementById('lessonUrl').value;
  if (!name.trim()) {
    alert("Lesson name required!");
    return;
  }
  window.lessons.push({ name, description, url });
  // Add new lesson to all students' completedLessons if not already tracked
  window.users.forEach(u => {
    if (u.role === 'student') {
      if (!Array.isArray(u.completedLessons)) u.completedLessons = [];
      // No action: completedLessons just tracks which lessons are complete, not the lessons themselves
    }
  });
  syncAll();
  alert('Lesson saved!');
  if (window.showHome) setTimeout(window.showHome, 200);
};

// Patch deleteLesson to sync all
const _origDeleteLesson = window.deleteLesson;
window.deleteLesson = function(index) {
  window.lessons.splice(index, 1);
  // Remove lesson index from all students' completedLessons
  window.users.forEach(u => {
    if (u.role === 'student') {
      if (Array.isArray(u.completedLessons)) {
        u.completedLessons = u.completedLessons.filter(i => i !== index);
      }
    }
  });
  syncAll();
  if (window.showHome) setTimeout(window.showHome, 200);
};

// Patch markLessonComplete to sync progress
const _origMarkLessonComplete = window.markLessonComplete;
window.markLessonComplete = function(index) {
  if (!window.currentUser.completedLessons.includes(index)) {
    window.currentUser.completedLessons.push(index);
    window.currentUser.progress = window.currentUser.completedLessons.length;
    // Update in users list
    const idx = window.users.findIndex(u => u.email === window.currentUser.email);
    if (idx !== -1) window.users[idx] = window.currentUser;
    syncAll();
    alert("Marked as complete!");
  }
};

// Patch feedback functions to sync
const _origSubmitFeedback = window.submitFeedback;
window.submitFeedback = function() {
  _origSubmitFeedback();
  syncAll();
};
const _origDeleteFeedback = window.deleteFeedback;
window.deleteFeedback = function(index) {
  _origDeleteFeedback(index);
  syncAll();
};
const _origCommentFeedback = window.commentFeedback;
window.commentFeedback = function(index) {
  _origCommentFeedback(index);
  syncAll();
};
const _origDeleteComment = window.deleteComment;
window.deleteComment = function(fbIndex, cIndex) {
  _origDeleteComment(fbIndex, cIndex);
  syncAll();
};

// Ensure feedback list reloads from storage each time
const _origRenderFeedbackList = window.renderFeedbackList;
window.renderFeedbackList = function() {
  restoreFromStorage();
  _origRenderFeedbackList();
};

// Patch lesson display to always reload from storage
const _origShowStartPage = window.showStartPage;
window.showStartPage = function() {
  restoreFromStorage();
  _origShowStartPage();
};

// ==== Always Store All Data in LocalStorage ====
// All above patches already do this

// ==== Ensure Students See New Lessons ====
// This is handled: all students' lesson view is based on shared lessons array in localStorage.

// ==== End of Patch ====
