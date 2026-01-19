
// Max submissions

const RATE_LIMIT = {
    maxSubmissions: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    storageKey: 'formSubmissions'
};

// Captcha 

const CAPTCHA_CHALLENGES = [
    {
        question: 'What is <code>7 + 5</code>?',
        options: ['10', '11', '12', '13'],
        correct: 2
    },
    {
        question: 'Which color do you get mixing blue and yellow?',
        options: ['Purple', 'Orange', 'Green', 'Red'],
        correct: 2
    },
    {
        question: 'How many days are in a week?',
        options: ['5', '6', '7', '8'],
        correct: 2
    },
    {
        question: 'What is the capital of the Netherlands?',
        options: ['Rotterdam', 'Amsterdam', 'The Hague', 'Utrecht'],
        correct: 1
    },
    {
        question: 'Which season comes after summer?',
        options: ['Spring', 'Winter', 'Autumn', 'Summer'],
        correct: 2
    },
    {
        question: 'What is <code>15 - 8</code>?',
        options: ['6', '7', '8', '9'],
        correct: 1
    },
    {
        question: 'How many minutes are in an hour?',
        options: ['30', '45', '60', '100'],
        correct: 2
    },
    {
        question: 'Which animal says "meow"?',
        options: ['Dog', 'Cat', 'Bird', 'Fish'],
        correct: 1
    },
    {
        question: 'What is <code>3 × 4</code>?',
        options: ['7', '10', '12', '14'],
        correct: 2
    },
    {
        question: 'Which shape has 4 equal sides?',
        options: ['Triangle', 'Circle', 'Square', 'Oval'],
        correct: 2
    }
];

let captchaVerified = false;
let currentChallenge = null;


// Rate Limiting Functions
function getSubmissionCount() {
    const data = localStorage.getItem(RATE_LIMIT.storageKey);
    if (!data) return { count: 0, timestamp: Date.now() };

    const parsed = JSON.parse(data);
    const now = Date.now();

    if (now - parsed.timestamp > RATE_LIMIT.windowMs) {
        return { count: 0, timestamp: now };
    }

    return parsed;
}

function incrementSubmissionCount() {
    const current = getSubmissionCount();
    const newData = {
        count: current.count + 1,
        timestamp: current.count === 0 ? Date.now() : current.timestamp
    };
    localStorage.setItem(RATE_LIMIT.storageKey, JSON.stringify(newData));
    return newData.count;
}

function isRateLimited() {
    const { count } = getSubmissionCount();
    return count >= RATE_LIMIT.maxSubmissions;
}

function getRemainingTime() {
    const data = getSubmissionCount();
    const elapsed = Date.now() - data.timestamp;
    const remaining = RATE_LIMIT.windowMs - elapsed;
    return Math.ceil(remaining / 60000);
}

// Captcha Functions

function initCaptcha() {
    currentChallenge = CAPTCHA_CHALLENGES[Math.floor(Math.random() * CAPTCHA_CHALLENGES.length)];
    captchaVerified = false;

    const challengeEl = document.getElementById('captcha-challenge');
    const optionsEl = document.getElementById('captcha-options');
    const statusEl = document.getElementById('captcha-status');
    const captchaEl = document.getElementById('captcha');

    captchaEl.classList.remove('captcha--verified');
    challengeEl.innerHTML = currentChallenge.question;
    statusEl.textContent = '';
    statusEl.className = 'captcha__status';

    // Shuffle options
    const shuffledOptions = currentChallenge.options.map((opt, idx) => ({ text: opt, originalIndex: idx }));
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    optionsEl.innerHTML = '';
    shuffledOptions.forEach((option, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'captcha__option';
        btn.innerHTML = option.text;
        btn.dataset.index = option.originalIndex;
        btn.addEventListener('click', () => handleCaptchaAnswer(btn, option.originalIndex));
        optionsEl.appendChild(btn);
    });
}

function handleCaptchaAnswer(btn, selectedIndex) {
    if (captchaVerified) return;

    const statusEl = document.getElementById('captcha-status');
    const captchaEl = document.getElementById('captcha');
    const allButtons = document.querySelectorAll('.captcha__option');

    allButtons.forEach(b => {
        b.classList.remove('captcha__option--selected', 'captcha__option--correct', 'captcha__option--wrong');
    });

    if (selectedIndex === currentChallenge.correct) {
        captchaVerified = true;
        btn.classList.add('captcha__option--correct');
        captchaEl.classList.add('captcha--verified');
        statusEl.textContent = '✓ Verified! You can now submit the form.';
        statusEl.className = 'captcha__status captcha__status--success';

        // Disable all buttons
        allButtons.forEach(b => b.disabled = true);
    } else {
        btn.classList.add('captcha__option--wrong');
        statusEl.textContent = '✗ Incorrect. Try again!';
        statusEl.className = 'captcha__status captcha__status--error';

        // Generate new challenge after delay
        setTimeout(() => {
            initCaptcha();
        }, 1500);
    }
}

function isCaptchaVerified() {
    return captchaVerified;
}

function resetCaptcha() {
    initCaptcha();
}

// Form Status Display

function showStatus(message, isError = false) {
    const statusEl = document.getElementById('form-status');
    statusEl.textContent = message;
    statusEl.className = 'form__status ' + (isError ? 'form__status--error' : 'form__status--success');
}

function hideStatus() {
    const statusEl = document.getElementById('form-status');
    statusEl.className = 'form__status';
    statusEl.textContent = '';
}


// Button Event Listeners

document.getElementById('btn-contact').addEventListener('click', function() {
    document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
});

// Resume download button

document.getElementById('btn-resume').addEventListener('click', function() {
    const link = document.createElement('a');
    link.href = 'Esmee-Wijngaarde-CV.pdf'; 
    link.download = 'Esmee_Wijngaarde_Resume.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Form Submission Handler

document.getElementById('contact-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    hideStatus();

    const form = this;
    const submitBtn = document.getElementById('btn-submit');

    // Check rate limit
    if (isRateLimited()) {
        const minutes = getRemainingTime();
        showStatus(`Too many submissions. Please try again in ${minutes} minutes.`, true);
        return;
    }

    // Check captcha
    if (!isCaptchaVerified()) {
        showStatus('Please complete the developer verification above.', true);
        return;
    }

    // Validate fields
    const fname = document.getElementById('fname').value.trim();
    const lname = document.getElementById('lname').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    if (!fname || !lname || !email || !message) {
        showStatus('Please fill in all fields.', true);
        return;
    }

    // Disable button during submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
        const formData = new FormData(form);

        const response = await fetch(form.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            incrementSubmissionCount();
            showStatus('Thank you for your message, ' + fname + '! I will get back to you soon.');
            form.reset();
            resetCaptcha();
        } else {
            const data = await response.json();
            if (data.errors) {
                showStatus(data.errors.map(err => err.message).join(', '), true);
            } else {
                showStatus('Something went wrong. Please try again.', true);
            }
        }
    } catch (error) {
        showStatus('Network error. Please check your connection and try again.', true);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
    }
});

document.addEventListener('DOMContentLoaded', initCaptcha);
