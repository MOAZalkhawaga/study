let timerInterval;
let secondsLeft;
let currentTasks = [];
let currentTaskIndex = 0;
let sessionTasksList = {}; 

function addSubjectField() {
    const container = document.getElementById('subjectsContainer');
    const div = document.createElement('div');
    div.className = 'subject-input';
    div.innerHTML = `<input type="text" class="subject-name" placeholder="اسم المادة">
                     <button type="button" onclick="this.parentElement.remove()" style="background:#ff7675; color:white">-</button>`;
    container.appendChild(div);
}

function generateSchedule() {
    const subjectInputs = document.querySelectorAll('.subject-name');
    let hours = parseFloat(document.getElementById('totalHours').value);
    
    if (hours > 24) hours = 24;
    
    const subjects = Array.from(subjectInputs).map(input => input.value).filter(v => v);
    if (subjects.length === 0 || !hours) return alert("أدخل البيانات بشكل صحيح!");

    const totalMinutes = hours * 60;
    const timePerSub = totalMinutes / subjects.length;

    let workTime = (hours >= 5) ? 50 : 25;
    let breakTime = (hours >= 5) ? 10 : 5;
    
    currentTasks = [];
    let html = "<h3>🗓️ جدول المذاكرة:</h3>";

    subjects.forEach((sub) => {
        let timeLeftForSub = timePerSub;
        html += `<div style="margin-top:15px; font-weight:bold; color:#2980b9">📍 ${sub}</div>`;
        
        while (timeLeftForSub >= (workTime + breakTime)) {
            const taskId = currentTasks.length;
            currentTasks.push({ title: sub, duration: workTime, type: 'work' });
            html += `<div class="schedule-item" id="item-${taskId}">📖 جلسة مذاكرة (${workTime} د)</div>`;
            
            currentTasks.push({ title: `استراحة (${sub})`, duration: breakTime, type: 'break' });
            html += `<div class="schedule-item rest-item" id="item-${currentTasks.length-1}">☕ استراحة (${breakTime} د)</div>`;
            
            timeLeftForSub -= (workTime + breakTime);
        }
    });

    document.getElementById('scheduleResult').innerHTML = html;
    document.getElementById('timerContainer').style.display = 'block';
    sessionTasksList = {};
    startTask(0);
}

function startTask(index) {
    if (index >= currentTasks.length) {
        alert("🎉 مبروك! أتممت يومك الدراسي.");
        return;
    }
    
    document.querySelectorAll('.schedule-item').forEach(el => el.classList.remove('active-task'));
    const currentEl = document.getElementById(`item-${index}`);
    if (currentEl) currentEl.classList.add('active-task');

    currentTaskIndex = index;
    const task = currentTasks[index];
    secondsLeft = task.duration * 60;
    
    document.getElementById('timerSubject').innerText = task.title;
    document.getElementById('timerStatus').innerText = task.type === 'work' ? "حان وقت الجد!" : "وقت الراحة";
    
    const skipBtn = document.getElementById('skipBtn');
    skipBtn.style.display = (task.type === 'break') ? 'inline-block' : 'none';

    renderTasks();
    updateDisplay();
    pauseTimer();
}

function toggleTaskDone(index) {
    sessionTasksList[currentTaskIndex][index].done = !sessionTasksList[currentTaskIndex][index].done;
    renderTasks();

    const tasks = sessionTasksList[currentTaskIndex] || [];
    const allDone = tasks.length > 0 && tasks.every(t => t.done);
    
    if (allDone && timerInterval && currentTasks[currentTaskIndex].type === 'work') {
        setTimeout(() => {
            const review = confirm("أنهيت المهام مبكراً! هل تريد إكمال الوقت في المراجعة؟ (إلغاء يبدأ البريك الآن)");
            if (!review) handleSessionEnd(true);
        }, 300);
    }
}

function handleSessionEnd(forceSkip = false) {
    clearInterval(timerInterval);
    timerInterval = null;
    if (!forceSkip) document.getElementById('alarmSound').play();

    const tasks = sessionTasksList[currentTaskIndex] || [];
    const pending = tasks.filter(t => !t.done);

    if (!forceSkip && currentTasks[currentTaskIndex].type === 'work' && pending.length > 0) {
        if (confirm("لم تنهِ المهام. هل تريد 10 دقائق إضافية؟")) {
            secondsLeft = 10 * 60;
            toggleTimer();
            return;
        }
    }
    
    startTask(currentTaskIndex + 1);
    if (currentTasks[currentTaskIndex]) toggleTimer();
}

function toggleTimer() {
    if (timerInterval) {
        pauseTimer();
    } else {
        document.getElementById('startBtn').innerText = "إيقاف";
        timerInterval = setInterval(() => {
            secondsLeft--;
            updateDisplay();
            if (secondsLeft <= 0) handleSessionEnd();
        }, 1000);
    }
}

function skipBreak() { handleSessionEnd(true); }

function updateDisplay() {
    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    document.getElementById('timerDisplay').innerText = 
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('startBtn').innerText = "ابدأ الجلسة";
}

function resetTimer() { pauseTimer(); startTask(currentTaskIndex); }

function addTaskToSession() {
    const input = document.getElementById('newTaskInput');
    if (!input.value.trim()) return;
    if (!sessionTasksList[currentTaskIndex]) sessionTasksList[currentTaskIndex] = [];
    sessionTasksList[currentTaskIndex].push({ text: input.value, done: false });
    input.value = "";
    renderTasks();
}

function renderTasks() {
    const container = document.getElementById('sessionTasks');
    container.innerHTML = "";
    (sessionTasksList[currentTaskIndex] || []).forEach((task, i) => {
        const div = document.createElement('div');
        div.className = `task-item ${task.done ? 'completed' : ''}`;
        div.innerHTML = `<input type="checkbox" ${task.done ? 'checked' : ''} onclick="toggleTaskDone(${i})"> <span>${task.text}</span>`;
        container.appendChild(div);
    });
}