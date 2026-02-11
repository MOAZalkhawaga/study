// المتغيرات العامة للتحكم في الحالة
let timerInterval;
let secondsLeft;
let currentTasks = [];
let currentTaskIndex = 0;
let sessionTasksList = {}; // تخزين المهام لكل جلسة بناءً على Index الجلسة

// 1. وظيفة إضافة حقل مادة جديد في الواجهة
function addSubjectField() {
    const container = document.getElementById('subjectsContainer');
    const div = document.createElement('div');
    div.className = 'subject-input';
    div.innerHTML = `
        <input type="text" class="subject-name" placeholder="اسم المادة">
        <button type="button" onclick="this.parentElement.remove()" style="background:#ff7675; color:white">-</button>
    `;
    container.appendChild(div);
}

// 2. وظيفة توليد الجدول وتقسيم الوقت
function generateSchedule() {
    const subjectInputs = document.querySelectorAll('.subject-name');
    let hours = parseFloat(document.getElementById('totalHours').value);
    
    // تطبيق سقف الـ 24 ساعة
    if (hours > 24) {
        hours = 24;
        document.getElementById('totalHours').value = 24;
    }
    
    const subjects = Array.from(subjectInputs).map(input => input.value).filter(v => v);
    if (subjects.length === 0 || !hours || hours <= 0) {
        alert("الرجاء إدخال المواد وعدد الساعات بشكل صحيح!");
        return;
    }

    const totalMinutes = hours * 60;
    const timePerSub = totalMinutes / subjects.length;

    // تحديد نظام الوقت: 50/10 إذا كانت الساعات >= 5، وإلا 25/5
    let workDuration = (hours >= 5) ? 50 : 25;
    let breakDuration = (hours >= 5) ? 10 : 5;
    
    currentTasks = [];
    let html = "<h3>🗓️ جدول المذاكرة الذكي:</h3>";

    subjects.forEach((sub) => {
        let timeLeftForSub = timePerSub;
        html += `<div style="margin-top:15px; font-weight:bold; color:#2980b9; border-bottom:1px solid #eee;">📍 مادة: ${sub}</div>`;
        
        while (timeLeftForSub >= (workDuration + breakDuration)) {
            const taskId = currentTasks.length;
            // إضافة جلسة عمل
            currentTasks.push({ title: sub, duration: workDuration, type: 'work' });
            html += `<div class="schedule-item" id="item-${taskId}">📖 جلسة مذاكرة (${workDuration} د)</div>`;
            
            // إضافة جلسة راحة
            currentTasks.push({ title: `استراحة (${sub})`, duration: breakDuration, type: 'break' });
            html += `<div class="schedule-item rest-item" style="border-right-color:#2ecc71">☕ استراحة (${breakDuration} د)</div>`;
            
            timeLeftForSub -= (workDuration + breakDuration);
        }

        // معالجة الوقت المتبقي الصغير للمادة
        if (timeLeftForSub > 0) {
            currentTasks.push({ title: sub, duration: Math.floor(timeLeftForSub), type: 'work' });
            html += `<div class="schedule-item" id="item-${currentTasks.length-1}">📖 مراجعة ختامية (${Math.floor(timeLeftForSub)} د)</div>`;
        }
    });

    document.getElementById('scheduleResult').innerHTML = html;
    document.getElementById('timerContainer').style.display = 'block';
    
    // تصفير المهام السابقة والبدء من أول جلسة
    sessionTasksList = {};
    startTask(0);
}

// 3. نظام إدارة المهام (Tasks) داخل التايمر
function addTaskToSession() {
    const input = document.getElementById('newTaskInput');
    const taskText = input.value.trim();
    if (!taskText) return;

    if (!sessionTasksList[currentTaskIndex]) {
        sessionTasksList[currentTaskIndex] = [];
    }
    
    sessionTasksList[currentTaskIndex].push({ text: taskText, done: false });
    input.value = "";
    renderTasks();
}

function renderTasks() {
    const container = document.getElementById('sessionTasks');
    container.innerHTML = "";
    const tasks = sessionTasksList[currentTaskIndex] || [];
    
    tasks.forEach((task, index) => {
        const div = document.createElement('div');
        div.className = `task-item ${task.done ? 'completed' : ''}`;
        div.innerHTML = `
            <input type="checkbox" ${task.done ? 'checked' : ''} onclick="toggleTaskDone(${index})">
            <span>${task.text}</span>
        `;
        container.appendChild(div);
    });
}

// 4. منطق إنهاء المهام والسؤال عن المراجعة أو الراحة المبكرة
function toggleTaskDone(index) {
    sessionTasksList[currentTaskIndex][index].done = !sessionTasksList[currentTaskIndex][index].done;
    renderTasks();

    // فحص هل انتهت كل المهام والتايمر لا يزال يعمل؟
    const tasks = sessionTasksList[currentTaskIndex] || [];
    const allDone = tasks.length > 0 && tasks.every(t => t.done);
    const isTimerRunning = timerInterval !== null;

    if (allDone && isTimerRunning && currentTasks[currentTaskIndex].type === 'work') {
        setTimeout(() => {
            const wantReview = confirm("عاش! خلصت مهامك قبل الوقت. حابب تكمل الوقت مراجعة؟ (لو ضغطت إلغاء هيبدأ البريك فوراً)");
            if (!wantReview) {
                handleSessionEnd(true); // إنهاء الجلسة فوراً
            }
        }, 300);
    }
}

// 5. التحكم في التايمر
function startTask(index) {
    if (index >= currentTasks.length) {
        alert("🎉 مبروك! أتممت جدولك بنجاح.");
        return;
    }

    // تمييز الجلسة الحالية في الجدول
    document.querySelectorAll('.schedule-item').forEach(el => el.classList.remove('active-task'));
    const currentItem = document.getElementById(`item-${index}`);
    if (currentItem) currentItem.classList.add('active-task');

    currentTaskIndex = index;
    const task = currentTasks[index];
    secondsLeft = task.duration * 60;
    
    document.getElementById('timerSubject').innerText = task.title;
    document.getElementById('timerStatus').innerText = (task.type === 'work') ? "ركز في المذاكرة ✍️" : "وقت الراحة ☕";
    
    renderTasks();
    updateDisplay();
    pauseTimer();
}

function toggleTimer() {
    const btn = document.getElementById('startBtn');
    if (timerInterval) {
        pauseTimer();
    } else {
        btn.innerText = "إيقاف مؤقت";
        timerInterval = setInterval(() => {
            secondsLeft--;
            updateDisplay();
            if (secondsLeft <= 0) {
                handleSessionEnd();
            }
        }, 1000);
    }
}

function handleSessionEnd(forceSkip = false) {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('alarmSound').play();

    const tasks = sessionTasksList[currentTaskIndex] || [];
    const pendingTasks = tasks.filter(t => !t.done);

    // إذا انتهى الوقت الطبيعي وهناك مهام لم تكتمل
    if (!forceSkip && currentTasks[currentTaskIndex].type === 'work' && pendingTasks.length > 0) {
        const extraTime = confirm("الوقت خلص وفيه مهام لسا مخلصتش. محتاج 10 دقائق زيادة؟");
        if (extraTime) {
            secondsLeft = 10 * 60;
            toggleTimer();
            return;
        }
    }
    
    // الانتقال للجلسة التالية
    startTask(currentTaskIndex + 1);
    
    // إذا كانت الجلسة التالية استراحة، تبدأ تلقائياً
    if (currentTasks[currentTaskIndex] && currentTasks[currentTaskIndex].type === 'break') {
        toggleTimer();
    }
}

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

function resetTimer() {
    pauseTimer();
    startTask(currentTaskIndex);
}