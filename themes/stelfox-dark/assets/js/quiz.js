(function () {
  var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

  function quizId(path) {
    path = path.toLowerCase().replace(/\/+$/, "");
    var h = 5381;
    for (var i = 0; i < path.length; i++) {
      h = ((h * 33) + path.charCodeAt(i)) >>> 0;
    }
    return B64[(h >> 12) & 63] + B64[(h >> 6) & 63] + B64[h & 63];
  }

  function writeBits(arr, value, n) {
    for (var i = n - 1; i >= 0; i--) arr.push((value >> i) & 1);
  }

  function readBits(arr, offset, n) {
    var v = 0;
    for (var i = 0; i < n; i++) v = (v << 1) | (arr[offset + i] || 0);
    return v;
  }

  function bitsToB64(bits) {
    var s = "";
    for (var i = 0; i < bits.length; i += 6) {
      var v = 0;
      for (var j = 0; j < 6; j++) v = (v << 1) | (bits[i + j] || 0);
      s += B64[v];
    }
    return s;
  }

  function b64ToBits(str) {
    var bits = [];
    for (var i = 0; i < str.length; i++) {
      var v = B64.indexOf(str[i]);
      for (var j = 5; j >= 0; j--) bits.push((v >> j) & 1);
    }
    return bits;
  }

  function answerToBitfield(ua, fieldset) {
    var isCheckbox = !!fieldset.querySelector("input[type='checkbox']");
    if (isCheckbox) {
      var bf = 0;
      for (var i = 0; i < ua.length; i++) bf |= (1 << ua[i]);
      return bf;
    }
    if (ua === "true") return 1;
    if (ua === "false") return 2;
    return 1 << parseInt(ua, 10);
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return match ? decodeURIComponent(match[1]) : "";
  }

  function setCookie(name, value) {
    document.cookie = name + "=" + encodeURIComponent(value) +
      "; path=/; max-age=31536000; SameSite=Lax";
  }

  function loadResults() {
    var raw = getCookie("qzs");
    if (!raw) return {};
    var results = {};
    var records = raw.split(".");
    for (var r = 0; r < records.length; r++) {
      var rec = records[r];
      if (rec.length < 4) continue;
      var id = rec.substring(0, 3);
      var bits = b64ToBits(rec.substring(3));
      var count = readBits(bits, 0, 4);
      var entries = [];
      for (var i = 0; i < count; i++) {
        var off = 4 + i * 9;
        entries.push({ q: readBits(bits, off, 4), v: readBits(bits, off + 4, 5) });
      }
      results[id] = entries;
    }
    return results;
  }

  function saveResult(qid, entries) {
    var results = loadResults();
    results[qid] = entries;
    var parts = [];
    var ids = Object.keys(results);
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      var es = results[id];
      var bits = [];
      writeBits(bits, es.length, 4);
      for (var j = 0; j < es.length; j++) {
        writeBits(bits, es[j].q, 4);
        writeBits(bits, es[j].v, 5);
      }
      while (bits.length % 6 !== 0) bits.push(0);
      parts.push(id + bitsToB64(bits));
    }
    var value = parts.join(".");
    while (value.length > 3800 && parts.length > 1) {
      parts.shift();
      value = parts.join(".");
    }
    setCookie("qzs", value);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.querySelector(".quiz-form");
    if (!form) return;

    var section = form.closest(".quiz");
    var answers = JSON.parse(form.getAttribute("data-quiz-answers"));
    var questions = form.querySelectorAll(".quiz-question");
    var total = questions.length;
    var current = 0;
    var graded = new Array(total);
    var userAnswers = new Array(total);
    var wrongOnce = false;
    var advancing = false;
    var progressFill = form.querySelector(".quiz-progress-fill");
    var progressText = form.querySelector(".quiz-progress-text");
    var prevBtn = form.querySelector(".quiz-prev");
    var nextBtn = form.querySelector(".quiz-next");
    var submitBtn = form.querySelector(".quiz-submit");
    var resultsDiv = form.querySelector(".quiz-results");
    var qid = quizId(window.location.pathname);

    // Clear any browser-autocompleted selections
    form.querySelectorAll("input:checked").forEach(function (input) {
      input.checked = false;
    });

    function showQuestion(idx) {
      questions.forEach(function (q, i) {
        q.classList.toggle("quiz-active", i === idx);
      });
      current = idx;
      wrongOnce = false;
      advancing = false;
      updateProgress();
      updateButtons();
      resultsDiv.textContent = "";
      resultsDiv.className = "quiz-results";
    }

    function updateProgress() {
      var pct = ((current + 1) / total) * 100;
      progressFill.style.width = pct + "%";
      progressText.textContent = (current + 1) + " / " + total;
    }

    function updateButtons() {
      prevBtn.disabled = current === 0;
      if (current === total - 1) {
        nextBtn.style.display = "none";
        submitBtn.style.display = "";
      } else {
        nextBtn.style.display = "";
        submitBtn.style.display = "none";
      }
    }

    function getUserAnswer(fieldset) {
      var hasCheckbox = fieldset.querySelector("input[type='checkbox']");
      if (hasCheckbox) {
        var checked = [];
        fieldset.querySelectorAll("input:checked").forEach(function (input) {
          checked.push(parseInt(input.value, 10));
        });
        return checked.length > 0 ? checked : undefined;
      } else {
        var selected = fieldset.querySelector("input:checked");
        return selected ? selected.value : undefined;
      }
    }

    function checkAnswer(fieldset, idx) {
      var answer = answers[idx];
      var ua = getUserAnswer(fieldset);
      if (Array.isArray(answer)) {
        return Array.isArray(ua) &&
          ua.length === answer.length &&
          answer.every(function (v) { return ua.indexOf(v) !== -1; });
      }
      return ua !== undefined && String(answer) === ua;
    }

    function clearFeedback(fieldset) {
      fieldset.querySelectorAll(".quiz-option").forEach(function (opt) {
        opt.classList.remove("quiz-wrong", "quiz-correct-hint");
      });
      fieldset.classList.remove("correct", "incorrect", "quiz-correct-pulse");
    }

    function markWrong(fieldset) {
      var answer = answers[parseInt(fieldset.getAttribute("data-question-index"), 10)];
      fieldset.querySelectorAll("input:checked").forEach(function (input) {
        input.closest(".quiz-option").classList.add("quiz-wrong");
      });
      if (Array.isArray(answer)) {
        fieldset.querySelectorAll("input").forEach(function (input) {
          var idx = parseInt(input.value, 10);
          if (answer.indexOf(idx) !== -1) {
            input.closest(".quiz-option").classList.add("quiz-correct-hint");
          }
        });
      }
      fieldset.classList.add("incorrect");
    }

    function markCorrect(fieldset) {
      fieldset.classList.remove("incorrect");
      fieldset.classList.add("correct", "quiz-correct-pulse");
    }

    function jiggle(btn) {
      btn.classList.remove("quiz-jiggle");
      void btn.offsetWidth;
      btn.classList.add("quiz-jiggle");
    }

    function handleAdvance(advanceBtn, onPass) {
      if (advancing) return;
      var fieldset = questions[current];
      var ua = getUserAnswer(fieldset);

      if (ua === undefined) {
        resultsDiv.textContent = "Pick an answer first.";
        resultsDiv.className = "quiz-results quiz-results-warning";
        return;
      }

      resultsDiv.textContent = "";
      resultsDiv.className = "quiz-results";

      if (graded[current] !== undefined) {
        onPass();
        return;
      }

      clearFeedback(fieldset);

      if (checkAnswer(fieldset, current)) {
        graded[current] = true;
        userAnswers[current] = ua;
        markCorrect(fieldset);
        advancing = true;
        setTimeout(function () {
          advancing = false;
          onPass();
        }, 300);
      } else if (wrongOnce) {
        graded[current] = false;
        userAnswers[current] = ua;
        markWrong(fieldset);
        onPass();
      } else {
        wrongOnce = true;
        markWrong(fieldset);
        jiggle(advanceBtn);
      }
    }

    function finish() {
      var entries = [];
      for (var i = 0; i < total; i++) {
        if (graded[i]) {
          entries.push({ q: i, v: answerToBitfield(userAnswers[i], questions[i]) });
        }
      }
      saveResult(qid, entries);
      showDone(entries.length === total);
    }

    function showDone(perfect) {
      questions.forEach(function (q) { q.classList.remove("quiz-active"); });
      form.querySelector(".quiz-nav").style.display = "none";
      form.querySelector(".quiz-progress").style.display = "none";
      section.querySelector("h2").style.display = "none";

      if (perfect) {
        resultsDiv.innerHTML =
          '<div class="quiz-checkmark">&#x2714;</div>' +
          '<span class="quiz-done">All done, you crushed it.</span>';
        resultsDiv.className = "quiz-results quiz-results-done";
      } else {
        resultsDiv.innerHTML =
          '<div class="quiz-checkmark quiz-checkmark-partial">~</div>' +
          '<span class="quiz-done quiz-done-partial">Finished, but a few slipped past you.</span>';
        resultsDiv.className = "quiz-results quiz-results-done";
      }

      var reset = document.createElement("button");
      reset.type = "button";
      reset.className = "quiz-reset";
      reset.textContent = "Start again?";
      reset.addEventListener("click", function () {
        // Load correct answers before clearing cookie
        var prev = loadResults()[qid] || [];

        // Clear this quiz from the cookie
        var results = loadResults();
        delete results[qid];
        var parts = [];
        var ids = Object.keys(results);
        for (var i = 0; i < ids.length; i++) {
          var id = ids[i];
          var es = results[id];
          var bits = [];
          writeBits(bits, es.length, 4);
          for (var j = 0; j < es.length; j++) {
            writeBits(bits, es[j].q, 4);
            writeBits(bits, es[j].v, 5);
          }
          while (bits.length % 6 !== 0) bits.push(0);
          parts.push(id + bitsToB64(bits));
        }
        setCookie("qzs", parts.length ? parts.join(".") : "");

        // Restore UI state
        reset.remove();
        resultsDiv.innerHTML = "";
        resultsDiv.className = "quiz-results";
        section.querySelector("h2").style.display = "";
        form.querySelector(".quiz-progress").style.display = "";
        form.querySelector(".quiz-nav").style.display = "";

        // Reset grading state
        for (var i = 0; i < total; i++) {
          graded[i] = undefined;
          userAnswers[i] = undefined;
        }

        // Clear all inputs then restore previously correct answers
        form.querySelectorAll("input").forEach(function (input) {
          input.checked = false;
          input.disabled = false;
        });

        for (var p = 0; p < prev.length; p++) {
          var entry = prev[p];
          var fieldset = questions[entry.q];
          var inputs = fieldset.querySelectorAll("input");
          inputs.forEach(function (input) {
            var isCheckbox = input.type === "checkbox";
            var bitIdx = isCheckbox ? parseInt(input.value, 10) : -1;

            if (isCheckbox) {
              input.checked = !!(entry.v & (1 << bitIdx));
            } else if (input.value === "true") {
              input.checked = (entry.v === 1);
            } else if (input.value === "false") {
              input.checked = (entry.v === 2);
            } else {
              input.checked = !!(entry.v & (1 << parseInt(input.value, 10)));
            }
          });
        }

        showQuestion(0);
      });
      section.appendChild(reset);
    }

    questions.forEach(function (fieldset, idx) {
      fieldset.addEventListener("change", function () {
        if (graded[idx] !== undefined) return;
        clearFeedback(fieldset);
        wrongOnce = false;
      });
    });

    prevBtn.addEventListener("click", function () {
      if (current > 0) showQuestion(current - 1);
    });

    nextBtn.addEventListener("click", function () {
      handleAdvance(nextBtn, function () {
        if (current < total - 1) showQuestion(current + 1);
      });
    });

    submitBtn.addEventListener("click", function () {
      handleAdvance(submitBtn, finish);
    });

    var existing = loadResults()[qid];
    if (existing) {
      showDone(existing.length === total);
    } else {
      showQuestion(0);
    }
  });
})();
