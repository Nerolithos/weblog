(function () {
  'use strict';

  var answers = document.querySelectorAll('[data-exam-answer]');
  if (!answers.length) return;

  function setRevealed(answer, revealed) {
    answer.classList.toggle('is-revealed', revealed);
    answer.setAttribute('aria-expanded', revealed ? 'true' : 'false');
  }

  answers.forEach(function (answer) {
    answer.addEventListener('click', function (event) {
      if (event.target.closest('a') && answer.classList.contains('is-revealed')) return;
      setRevealed(answer, !answer.classList.contains('is-revealed'));
    });

    answer.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      setRevealed(answer, !answer.classList.contains('is-revealed'));
    });
  });
})();
