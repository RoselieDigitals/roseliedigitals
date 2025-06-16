const app = document.getElementById('app'); 
let users = [];
let currentUser = null;
let lessons = JSON.parse(localStorage.getItem('lessons')) || [];
let feedbacks = [];

function setBackground(callback) {
  app.style.backgroundImage = "url('https://i.postimg.cc/bN802tp2/w-HERE-YOU-PREPARE-YOURSELF-WITH-THE-WORLD-OF-FINANCIAL-FREEDOM-16.png')";
  app.style.backgroundSize = 'cover';
  app.style.backgroundPosition = 'center';
  app.style.backgroundRepeat = 'no-repeat';
  app.style.height = '100vh';
  app.style.width = '100vw';
  app.innerHTML = '';
  callback();
}

function showStartPage() {
  app.innerHTML = `
    <div style="height: 100vh; width: 100vw; background: url('https://i.postimg.cc/6pxQQrXD/w-HERE-YOU-PREPARE-YOURSELF-WITH-THE-WORLD-OF-FINANCIAL-FREEDOM-17.png') center/cover no-repeat; display: flex; justify-content: center; align-items: center;">
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
    container.style.display = 'flex';
    container.style.height = '100vh';
    container.style.width = '100vw';

    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';

    const mainContent = document.createElement('div');
    mainContent.id = 'mainContent';
    mainContent.style.flexGrow = '1';
    mainContent.style.overflowY = 'auto';
    mainContent.style.padding = '20px';
    mainContent.style.height = '100vh';
    mainContent.style.boxSizing = 'border-box';

    const tabs = ['Dashboard', 'My Lessons', 'Feedback', 'Logout'];
    if (currentUser && currentUser.role === 'creator') {
      tabs.unshift('Create a New Lesson', '▶ Students Information');
    }

    const lessonButtons = document.createElement('div');
    let lastClickedTab = null;

    tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.innerText = tab;
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
        }

        else if (tab === '▶ Students Information' && currentUser.role === 'creator') {
          mainContent.innerHTML = `
            <h2>Student Information</h2>
            <table>
              <tr><th>Full Name</th><th>Email</th><th>Country</th></tr>
              ${users.filter(u => u.role === 'student').map(u => `<tr><td>${u.name}</td><td>${u.email}</td><td>${u.country}</td></tr>`).join('')}
            </table>
            <br>
            <h3>Sales Reports</h3>
            <p>Philippines: ₱${users.filter(u => u.country.toLowerCase() === 'philippines').length * 599}</p>
            <p>International: $${users.filter(u => u.country.toLowerCase() !== 'philippines').length * 20}</p>
            <br>
            <h3>Sales Analytics</h3>
            <canvas id="salesChart" width="400" height="200"></canvas>
            <h3>Student Progress Analytics</h3>
            <canvas id="progressChart" width="400" height="200"></canvas>
          `;
          drawCharts();
        }

        else if (tab === 'Create a New Lesson') {
          mainContent.innerHTML = `
            <h2>Create a New Lesson</h2>
            <input type="text" id="lessonName" placeholder="Lesson Name"><br>
            <textarea id="lessonDesc" placeholder="Lesson Description"></textarea><br>
            <input type="url" id="lessonUrl" placeholder="Lesson Website URL"><br>
            <button onclick="addLesson()">Save Lesson</button>
          `;
        }

        else if (tab === 'My Lessons') {
  if (mainContent.innerHTML.includes('My Lessons')) {
    mainContent.innerHTML = '';
    lessonButtons.innerHTML = '';
    lastClickedTab = null;
  } else {
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
  }
}


        else if (tab === 'Feedback') {
          mainContent.innerHTML = `
            <h2>Feedback</h2>
            <textarea id="feedbackInput" placeholder="Write feedback..."></textarea><br>
            <button onclick="submitFeedback()">Post Feedback</button>
            <div id="feedbackList" style="margin-top: 20px;"></div>
          `;
          renderFeedbackList();
        }

        else if (tab === 'Logout') {
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
  alert('Lesson saved!');
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
    alert("Marked as complete!");
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
  renderFeedbackList();
  document.getElementById('feedbackInput').value = '';
}

function renderFeedbackList() {
  const container = document.getElementById('feedbackList');
  container.innerHTML = '';
  feedbacks.forEach((fb, index) => {
    const fbBox = document.createElement('div');
    fbBox.style.border = '1px solid white';
    fbBox.style.padding = '10px';
    fbBox.style.marginBottom = '10px';
    fbBox.innerHTML = `
      <div style="font-size: 0.5em;"><strong>${fb.name}</strong> <small>${fb.time}</small></div>
      <p style="font-size: 1em; text-align: center;">${fb.text}</p>
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

function deleteFeedback(index) {
  if (feedbacks[index].email === currentUser.email) {
    feedbacks.splice(index, 1);
    renderFeedbackList();
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
    renderFeedbackList();
  }
}

function deleteComment(fbIndex, cIndex) {
  if (feedbacks[fbIndex].comments[cIndex].email === currentUser.email) {
    feedbacks[fbIndex].comments.splice(cIndex, 1);
    renderFeedbackList();
  }
}

function drawCharts() {
  const salesChart = document.getElementById('salesChart').getContext('2d');
  new Chart(salesChart, {
    type: 'bar',
    data: {
      labels: ['Philippines', 'International'],
      datasets: [{
        label: 'Sales Count',
        data: [
          users.filter(u => u.country.toLowerCase() === 'philippines').length,
          users.filter(u => u.country.toLowerCase() !== 'philippines').length
        ],
        backgroundColor: ['#00aaff', '#ffaa00']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });

  const progressChart = document.getElementById('progressChart').getContext('2d');
  new Chart(progressChart, {
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
      }]
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

document.addEventListener('DOMContentLoaded', showStartPage);
