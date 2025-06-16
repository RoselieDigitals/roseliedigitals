const app = document.getElementById('app'); 
// Always load users from localStorage if available
let users = JSON.parse(localStorage.getItem('lms_users')) || [];
let currentUser = null;
let lessons = JSON.parse(localStorage.getItem('lessons')) || [];
let feedbacks = JSON.parse(localStorage.getItem('lms_feedbacks')) || [];
let notifications = [];

// --- Notification System ---
function showNotification(msg, type = "info") {
  notifications.push({ msg, type, time: Date.now() });
  renderNotifications();
}
function renderNotifications() {
  let notifBar = document.getElementById('notifBar');
  if (!notifBar) {
    notifBar = document.createElement('div');
    notifBar.id = 'notifBar';
    notifBar.style.position = 'fixed';
    notifBar.style.top = '0';
    notifBar.style.left = '0';
    notifBar.style.width = '100%';
    notifBar.style.zIndex = '1000';
    notifBar.style.textAlign = 'center';
    notifBar.style.pointerEvents = 'none';
    document.body.appendChild(notifBar);
  }
  notifBar.innerHTML = notifications.map(n =>
    `<div style="display:inline-block;margin:10px;padding:10px 30px;background:${n.type==='error'?'#f55':'#333'};color:white;font-weight:bold;border-radius:8px;">
      ${n.msg}
    </div>`
  ).join('');
  setTimeout(() => {
    notifications.shift();
    notifBar.innerHTML = notifications.map(n =>
      `<div style="display:inline-block;margin:10px;padding:10px 30px;background:${n.type==='error'?'#f55':'#333'};color:white;font-weight:bold;border-radius:8px;">
        ${n.msg}
      </div>`
    ).join('');
  }, 3000);
}

// --- Add search bar to sidebar ---
function renderSearchBar(sidebar, mainContent) {
  const searchDiv = document.createElement('div');
  searchDiv.innerHTML = `
    <input type="text" id="searchInput" placeholder="Search lessons/feedback..." style="width:90%;padding:6px;margin:10px 0;border-radius:5px;">
    <button onclick="runSearch()" style="width:80%;margin-bottom:10px;">Search</button>
  `;
  sidebar.appendChild(searchDiv);

  window.runSearch = function() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    if (!q.trim()) { showNotification("Please enter a keyword", "error"); return; }
    let lessonResults = lessons.filter(l => l.name.toLowerCase().includes(q) || (l.description && l.description.toLowerCase().includes(q)));
    let feedbackResults = feedbacks.filter(fb => fb.text.toLowerCase().includes(q) || fb.name.toLowerCase().includes(q));
    mainContent.innerHTML = `<h2>Search Results for "${q}"</h2>`;
    if (lessonResults.length) {
      mainContent.innerHTML += `<h3>Lessons</h3>${lessonResults.map(l => `<div style="margin-bottom:10px;"><b>${l.name}</b><br>${l.description || ''}</div>`).join('')}`;
    }
    if (feedbackResults.length) {
      mainContent.innerHTML += `<h3>Feedback</h3>${feedbackResults.map(fb => `<div style="margin-bottom:10px;"><b>${fb.name}</b>: ${fb.text}</div>`).join('')}`;
    }
    if (!lessonResults.length && !feedbackResults.length) {
      mainContent.innerHTML += "<div>No results found.</div>";
    }
  }
}

// --- Profile Page ---
function showProfile() {
  setBackground(() => {
    app.innerHTML = `
      <div style="text-align:center;margin-top:40px;">
        <h2>My Profile</h2>
        <div>
          <label>Full Name:</label><br>
          <input id="profileName" value="${currentUser.name}" style="padding:6px;width:220px;"><br>
          <label>Email:</label><br>
          <input value="${currentUser.email}" disabled style="padding:6px;width:220px;background:#eee;color:#666;"><br>
          <label>Country:</label><br>
          <input id="profileCountry" value="${currentUser.country}" style="padding:6px;width:220px;"><br>
          <button onclick="saveProfile()">Save Profile</button>
        </div>
        <div style="margin-top:30px;">
          <h3>Reset Password</h3>
          <input id="oldPass" type="password" placeholder="Current password" style="margin-bottom:5px;"><br>
          <input id="newPass" type="password" placeholder="New password"><br>
          <button onclick="resetPassword()">Change Password</button>
        </div>
        <div style="margin-top:30px;">
          <button onclick="showHome()">Back to Home</button>
        </div>
      </div>
    `;
  });
}
window.saveProfile = function() {
  const name = document.getElementById('profileName').value;
  const country = document.getElementById('profileCountry').value;
  currentUser.name = name;
  currentUser.country = country;
  const idx = users.findIndex(u => u.email === currentUser.email);
  if (idx > -1) {
    users[idx] = currentUser;
    localStorage.setItem('lms_users', JSON.stringify(users));
    showNotification("Profile updated!");
  }
}
window.resetPassword = function() {
  const oldPass = document.getElementById('oldPass').value;
  const newPass = document.getElementById('newPass').value;
  if (oldPass !== currentUser.pass) { showNotification("Current password incorrect!","error"); return; }
  if (!newPass || newPass.length < 4) { showNotification("New password too short!","error"); return; }
  currentUser.pass = newPass;
  const idx = users.findIndex(u => u.email === currentUser.email);
  if (idx > -1) {
    users[idx] = currentUser;
    localStorage.setItem('lms_users', JSON.stringify(users));
    showNotification("Password changed!");
  }
}

// --- Admin Tools (Pie/Line graph sales analytics, etc) ---
function showAdminTools() {
  setBackground(() => {
    app.innerHTML = `
      <div class="flex-container" style="margin:0;align-items:flex-start;">
        <div style="flex:1; min-width:250px; max-width:500px;">
          <h2>Admin Tools</h2>
          <div style="margin-bottom:25px;">
            <h3>Change Startup/Cover Image</h3>
            <input id="startupCoverInput" type="url" placeholder="Enter startup/cover image URL" style="width:100%;padding:6px;">
            <button onclick="changeStartupCover()">Save</button>
          </div>
          <div style="margin-bottom:25px;">
            <h3>Change Background Image</h3>
            <input id="backgroundInput" type="url" placeholder="Enter background image URL" style="width:100%;padding:6px;">
            <button onclick="changeBackgroundImage()">Save</button>
          </div>
        </div>
        <div style="flex:1; min-width:250px; max-width:700px; margin-left:2vw;">
          <h3>Sales Analytics</h3>
          <div style="display:flex; flex-direction:row; align-items: flex-start;">
            <div style="flex-shrink:0;">
              <canvas id="pieSalesChart" style="max-width:260px;"></canvas>
              <div style="margin:16px 0 0 0; text-align:center;">
                <button onclick="showSalesLine('daily')" style="margin:0 5px;">Daily</button>
                <button onclick="showSalesLine('weekly')" style="margin:0 5px;">Weekly</button>
                <button onclick="showSalesLine('monthly')" style="margin:0 5px;">Monthly</button>
                <button onclick="showSalesLine('yearly')" style="margin:0 5px;">Yearly</button>
              </div>
            </div>
            <div style="margin-left:3vw;width:100%;">
              <canvas id="lineSalesChart" style="width:100%;"></canvas>
            </div>
          </div>
        </div>
      </div>
      <button onclick="showHome()" style="margin-top:30px; margin-left:30px;">Back to Home</button>
    `;
    renderSalesPieChart();
    showSalesLine('daily');
  });
}

window.changeStartupCover = function() {
  const url = document.getElementById('startupCoverInput').value;
  if (!url) { showNotification("Please enter a valid URL!", "error"); return; }
  localStorage.setItem('lms_startup_cover', url);
  showNotification("Startup/Cover image changed!");
  // Optionally, instantly show the new cover page:
  // showStartPage();
};
window.changeBackgroundImage = function() {
  const url = document.getElementById('backgroundInput').value;
  if (!url) { showNotification("Please enter a valid URL!", "error"); return; }
  localStorage.setItem('lms_bg_img', url);
  showNotification("Background image changed!");
  // Instantly update background:
  app.style.backgroundImage = `url('${url}')`;
  app.style.backgroundSize = 'cover';
  app.style.backgroundPosition = 'center';
  app.style.backgroundRepeat = 'no-repeat';
};

function renderSalesPieChart() {
  const philCount = users.filter(u => u.role === 'student' && u.country.toLowerCase() === 'philippines').length;
  const intlCount = users.filter(u => u.role === 'student' && u.country.toLowerCase() !== 'philippines').length;
  const ctx = document.getElementById('pieSalesChart');
  if (!ctx) return;
  if (window.pieChartSales) window.pieChartSales.destroy();
  window.pieChartSales = new Chart(ctx.getContext('2d'), {
    type: 'pie',
    data: {
      labels: ['Philippines', 'International'],
      datasets: [{
        data: [philCount, intlCount],
        backgroundColor: ['#ff3333', '#3366ff'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: 'bottom' }
      }
    }
  });
}

window.showSalesLine = function(period) {
  let labels = [];
  let data = [];
  let unit = "";

  if (period === 'daily') {
    unit = "Today";
    labels = Array.from({length: 24}, (_,i) => `${i}:00`);
    data = labels.map(() => Math.floor(Math.random() * 5));
  } else if (period === 'weekly') {
    unit = "This week";
    labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    data = labels.map(() => Math.floor(Math.random() * 15));
  } else if (period === 'monthly') {
    unit = "This month";
    const now = new Date();
    const days = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    labels = Array.from({length: days}, (_,i) => `${i+1}`);
    data = labels.map(() => Math.floor(Math.random() * 10));
  } else if (period === 'yearly') {
    unit = "This year";
    labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    data = labels.map(() => Math.floor(Math.random() * 100));
  }

  const ctx = document.getElementById('lineSalesChart');
  if (!ctx) return;
  if (window.lineChartSales) window.lineChartSales.destroy();
  window.lineChartSales = new Chart(ctx.getContext('2d'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: `Sales (${unit})`,
        data: data,
        backgroundColor: '#3366ff22',
        borderColor: '#3366ff',
        fill: true,
        pointRadius: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
};

// --- Feedback Edit ---
function renderFeedbackList() {
  feedbacks = JSON.parse(localStorage.getItem('lms_feedbacks')) || [];
  const container = document.getElementById('feedbackList');
  container.innerHTML = '';
  feedbacks.forEach((fb, index) => {
    const fbBox = document.createElement('div');
    fbBox.style.border = '1px solid white';
    fbBox.style.padding = '10px';
    fbBox.style.marginBottom = '10px';
    fbBox.innerHTML = `
      <div style="font-size: 0.5em;"><strong>${fb.name}</strong> <small>${fb.time}</small></div>
      <p style="font-size: 1em; text-align: center;" id="fbText${index}">${fb.text}</p>
      ${fb.email === currentUser.email ? `<button onclick="editFeedback(${index})">Edit</button>` : ''}
      ${fb.email === currentUser.email ? `<button onclick="deleteFeedback(${index})">Delete</button>` : ''}
      <button onclick="commentFeedback(${index})">Comment</button>
      <div>${fb.comments.map((c, ci) => `
        <div style="margin-left: 20px; font-size: 0.5em;">
          <b>${c.name}</b>: ${c.text}
          ${c.email === currentUser.email ? `<button onclick="deleteComment(${index}, ${ci})">Delete</button>` : ''}
        </div>`).join('')}</div>
    `;
    container.appendChild(fbBox);
  });
}
window.editFeedback = function(index) {
  const fb = feedbacks[index];
  const newText = prompt("Edit your feedback:", fb.text);
  if (newText && newText !== fb.text) {
    feedbacks[index].text = newText;
    localStorage.setItem('lms_feedbacks', JSON.stringify(feedbacks));
    renderFeedbackList();
    showNotification("Feedback edited!");
  }
}

// --- Lesson Edit ---
function editLesson(index) {
  const l = lessons[index];
  setBackground(() => {
    app.innerHTML = `
      <div style="text-align:center;margin-top:50px;">
        <h2>Edit Lesson</h2>
        <input id="editLessonName" value="${l.name}" style="padding:6px;width:240px;"><br>
        <textarea id="editLessonDesc" style="padding:6px;width:240px;height:60px;">${l.description||''}</textarea><br>
        <input id="editLessonUrl" value="${l.url||''}" style="padding:6px;width:240px;"><br>
        <button onclick="saveLessonEdit(${index})">Save</button>
        <button onclick="showHome()">Cancel</button>
      </div>
    `;
  });
}
window.saveLessonEdit = function(index) {
  lessons[index].name = document.getElementById('editLessonName').value;
  lessons[index].description = document.getElementById('editLessonDesc').value;
  lessons[index].url = document.getElementById('editLessonUrl').value;
  localStorage.setItem('lessons', JSON.stringify(lessons));
  showNotification("Lesson updated");
  showHome();
}

// --- Student Deletion for Student Information (with auto-refresh) ---
window.deleteStudent = function(email) {
  users = users.filter(u => u.email !== email);
  localStorage.setItem('lms_users', JSON.stringify(users));
  showNotification("Student deleted.");
  showHome();
};

// --- Existing functions ---
function setBackground(callback) {
  // Use your new default background image!
  const customBg = localStorage.getItem('lms_bg_img');
  if (customBg) {
    app.style.backgroundImage = `url('${customBg}')`;
  } else {
    app.style.backgroundImage = "url('https://i.postimg.cc/hvwrFrt8/w-HERE-YOU-PREPARE-YOURSELF-WITH-THE-WORLD-OF-FINANCIAL-FREEDOM-18.png')";
  }
  app.style.backgroundSize = 'cover';
  app.style.backgroundPosition = 'center';
  app.style.backgroundRepeat = 'no-repeat';
  app.style.minHeight = '100vh';
  app.style.width = '100vw';
  app.innerHTML = '';
  callback();
}

function showStartPage() {
  const startupCover = localStorage.getItem('lms_startup_cover') || 'https://i.postimg.cc/6pxQQrXD/w-HERE-YOU-PREPARE-YOURSELF-WITH-THE-WORLD-OF-FINANCIAL-FREEDOM-17.png';
  app.innerHTML = `
    <div style="height: 100vh; width: 100vw; background: url('${startupCover}') center/cover no-repeat; display: flex; justify-content: center; align-items: center;">
      <button id="startBtn" style="padding: 20px 40px; font-size: 24px; background-color: rgba(0,0,0,0.7); color: white;">START</button>
    </div>
  `;
  document.getElementById('startBtn').onclick = showSignup;
}

function showSignup() {
  setBackground(() => {
    app.innerHTML = `
      <div style="text-align: center; color: white; padding-top: 100px;">
        <h2>Sign Up</h2>
        <input id="signupName" placeholder="Full Name"><br>
        <input id="signupEmail" placeholder="Email"><br>
        <input id="signupPass" type="password" placeholder="Password"><br>
        <input id="signupCountry" placeholder="Country"><br>
        <button onclick="signupUser()">Create Account</button><br><br>
        <button onclick="showLogin()">Already have an account? Login</button>
      </div>
    `;
  });
}

function signupUser() {
  const name = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const pass = document.getElementById('signupPass').value;
  const country = document.getElementById('signupCountry').value;
  const role = email === 'admin@lms.com' ? 'creator' : 'student';
  users.push({ name, email, pass, role, country, progress: 0, completedLessons: [] });
  // Save users to localStorage after signup
  localStorage.setItem('lms_users', JSON.stringify(users));
  showLogin();
}

function showLogin() {
  setBackground(() => {
    app.innerHTML = `
      <div style="text-align: center; color: white; padding-top: 100px;">
        <h2>Login</h2>
        <input id="loginEmail" placeholder="Email"><br>
        <input id="loginPass" type="password" placeholder="Password"><br>
        <button onclick="loginUser()">Login</button>
      </div>
    `;
  });
}

function loginUser() {
  // Always reload users from localStorage before logging in
  users = JSON.parse(localStorage.getItem('lms_users')) || [];
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  const found = users.find(u => u.email === email && u.pass === pass);
  if (found) {
    currentUser = found;
    showHome();
  } else {
    alert("Invalid email or password");
  }
}

function showHome() {
  app.innerHTML = '';
  setBackground(() => {
    const container = document.createElement('div');
    container.className = 'flex-container';
    container.style.height = '100vh';
    container.style.width = '100vw';

    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';

    const mainContent = document.createElement('div');
    mainContent.id = 'mainContent';

    const tabs = ['Dashboard', 'My Lessons', 'Feedback', 'Profile', 'Logout'];
    if (currentUser && currentUser.role === 'creator') {
      tabs.unshift('Create a New Lesson', '▶ Students Information', 'Admin Tools');
    }
    const lessonButtons = document.createElement('div');
    let lastClickedTab = null;

    renderSearchBar(sidebar, mainContent);

    tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.innerText = tab;
      btn.style.width = '100%';
      btn.onclick = () => {
        if (lastClickedTab === tab) {
          mainContent.innerHTML = '';
          lastClickedTab = null;
          return;
        }
        lastClickedTab = tab;
        if (tab === 'Dashboard') {
          const quotes = [
            "Believe in yourself and all that you are.",
            "Success starts with self-discipline.",
            "You are capable of amazing things.",
            "Push yourself, because no one else will.",
            "Stay positive. Work hard. Make it happen."
          ];
          const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
          mainContent.innerHTML = `
            <h2>Welcome, ${currentUser.name}!</h2>
            <p>You have completed ${currentUser.progress || 0} lessons.</p>
            <p>Progress: ${lessons.length ? Math.round((currentUser.progress || 0) / lessons.length * 100) : 0}%</p>
            <div style="margin-top:40px; text-align:center; animation: fadeIn 3s ease-in-out infinite alternate;">
              <p style="font-size: 2em; font-weight: bold;">"${randomQuote}"</p>
            </div>
            <style>
              @keyframes fadeIn {
                from { opacity: 0.4; }
                to { opacity: 1; }
              }
            </style>
          `;
        } else if (tab === '▶ Students Information' && currentUser.role === 'creator') {
          mainContent.innerHTML = `
            <h2>Student Information</h2>
            <table id="studentTable">
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Country</th>
                <th>Delete</th>
              </tr>
              ${users.filter(u => u.role === 'student').map((u, idx) => `
                <tr>
                  <td>${u.name}</td>
                  <td>${u.email}</td>
                  <td>${u.country}</td>
                  <td><button onclick="deleteStudent('${u.email}')">Delete</button></td>
                </tr>
              `).join('')}
            </table>
            <br>
            <h3>Student Progress Analytics</h3>
            <canvas id="progressChart"></canvas>
          `;
          drawCharts();
        } else if (tab === 'Create a New Lesson') {
          mainContent.innerHTML = `
            <h2>Create a New Lesson</h2>
            <input type="text" id="lessonName" placeholder="Lesson Name"><br>
            <textarea id="lessonDesc" placeholder="Lesson Description"></textarea><br>
            <input type="url" id="lessonUrl" placeholder="Lesson Website URL"><br>
            <button onclick="addLesson()">Save Lesson</button>
          `;
        } else if (tab === 'Admin Tools' && currentUser.role === 'creator') {
          showAdminTools();
        } else if (tab === 'My Lessons') {
          mainContent.innerHTML = `<h2>My Lessons</h2>`;
          lessonButtons.innerHTML = '';
          lessons.forEach((lesson, index) => {
            const lbtn = document.createElement('div');
            lbtn.style.display = 'flex';
            lbtn.style.alignItems = 'center';
            lbtn.style.justifyContent = 'space-between';
            lbtn.style.backgroundColor = 'rgba(255,255,255,0.1)';
            lbtn.style.color = '#fff';
            lbtn.style.padding = '5px';
            lbtn.style.margin = '5px';

            const nameBtn = document.createElement('button');
            nameBtn.innerText = lesson.name;
            nameBtn.style.background = 'transparent';
            nameBtn.style.color = 'white';
            nameBtn.style.border = 'none';
            nameBtn.onclick = () => {
              let contentHTML = `<h2>${lesson.name}</h2><p>${lesson.description}</p>`;
              if (lesson.url) contentHTML += `<p><a href='${lesson.url}' target='_blank' style='color:cyan;'>Visit lesson link</a></p>`;
              contentHTML += `<br><button onclick='markLessonComplete(${index})'>${currentUser.completedLessons.includes(index) ? 'Completed' : 'Mark as Complete'}</button>`;
              if (currentUser.role === 'creator') {
                contentHTML += `<button onclick='editLesson(${index})'>Edit</button>`;
              }
              mainContent.innerHTML = contentHTML;
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.innerText = 'Delete';
            deleteBtn.style.background = 'red';
            deleteBtn.style.color = 'white';
            deleteBtn.onclick = () => deleteLesson(index);

            lbtn.appendChild(nameBtn);
            if (currentUser.role === 'creator') lbtn.appendChild(deleteBtn);
            lessonButtons.appendChild(lbtn);
          });
        } else if (tab === 'Feedback') {
          mainContent.innerHTML = `
            <h2>Feedback</h2>
            <textarea id="feedbackInput" placeholder="Write feedback..."></textarea><br>
            <button onclick="submitFeedback()">Post Feedback</button>
            <div id="feedbackList" style="margin-top: 20px;"></div>
          `;
          renderFeedbackList();
        } else if (tab === 'Profile') {
          showProfile();
        } else if (tab === 'Logout') {
          currentUser = null;
          showLogin();
        }
      };
      sidebar.appendChild(btn);
      if (tab === 'My Lessons') sidebar.appendChild(lessonButtons);
    });

    container.appendChild(sidebar);
    container.appendChild(mainContent);
    app.appendChild(container);
  });
}

function addLesson() {
  const name = document.getElementById('lessonName').value;
  const description = document.getElementById('lessonDesc').value;
  const url = document.getElementById('lessonUrl').value;
  lessons.push({ name, description, url });
  localStorage.setItem('lessons', JSON.stringify(lessons));
  showNotification('Lesson saved!');
}

function deleteLesson(index) {
  lessons.splice(index, 1);
  localStorage.setItem('lessons', JSON.stringify(lessons));
  showHome();
}

function markLessonComplete(index) {
  if (!currentUser.completedLessons.includes(index)) {
    currentUser.completedLessons.push(index);
    currentUser.progress = currentUser.completedLessons.length;
    const userIdx = users.findIndex(u => u.email === currentUser.email);
    if (userIdx > -1) {
      users[userIdx] = currentUser;
      localStorage.setItem('lms_users', JSON.stringify(users));
    }
    showNotification("Marked as complete!");
  }
}

function submitFeedback() {
  const text = document.getElementById('feedbackInput').value;
  if (!text.trim()) return;
  feedbacks.push({
    name: currentUser.name,
    text,
    time: new Date().toLocaleString(),
    email: currentUser.email,
    comments: []
  });
  localStorage.setItem('lms_feedbacks', JSON.stringify(feedbacks));
  renderFeedbackList();
  document.getElementById('feedbackInput').value = '';
}

function deleteFeedback(index) {
  if (feedbacks[index].email === currentUser.email) {
    feedbacks.splice(index, 1);
    localStorage.setItem('lms_feedbacks', JSON.stringify(feedbacks));
    renderFeedbackList();
    showNotification("Feedback deleted");
  }
}

function commentFeedback(index) {
  const text = prompt("Enter your comment:");
  if (text) {
    feedbacks[index].comments.push({
      name: currentUser.name,
      text,
      email: currentUser.email
    });
    localStorage.setItem('lms_feedbacks', JSON.stringify(feedbacks));
    renderFeedbackList();
    showNotification("Comment added!");
  }
}

function deleteComment(fbIndex, cIndex) {
  if (feedbacks[fbIndex].comments[cIndex].email === currentUser.email) {
    feedbacks[fbIndex].comments.splice(cIndex, 1);
    localStorage.setItem('lms_feedbacks', JSON.stringify(feedbacks));
    renderFeedbackList();
    showNotification("Comment deleted!");
  }
}

function drawCharts() {
  const progressChart = document.getElementById('progressChart');
  if (progressChart) {
    new Chart(progressChart.getContext('2d'), {
      type: 'line',
      data: {
        labels: users.filter(u => u.role === 'student').map(u => u.name),
        datasets: [{
          label: 'Progress %',
          data: users.filter(u => u.role === 'student').map(u => {
            return lessons.length ? Math.round((u.progress || 0) / lessons.length * 100) : 0;
          }),
          backgroundColor: '#00ff88',
          borderColor: '#00ff88',
          fill: false
        }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            max: 100,
            beginAtZero: true
          }
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', showStartPage);