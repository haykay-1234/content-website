/* =========================================================
   NOCTURNE CONTENT STUDIO: interactions and animation
   ========================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Footer year ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header: scrolled state + mobile menu ---------- */
  var header = $('#header');
  var toggle = $('#navToggle');

  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    header.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () {
    setMenu(!header.classList.contains('open'));
  });
  $$('#nav a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 860) setMenu(false);
  });

  /* ---------- Highlight the nav link of the section in view ---------- */
  var navLinks = $$('.nav-links a');
  var sections = navLinks
    .map(function (a) { return $(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Hero headline: split into words for the reveal ---------- */
  var title = $('#heroTitle');
  if (title) {
    var words = title.textContent.trim().split(/\s+/);
    title.setAttribute('aria-label', words.join(' '));
    title.innerHTML = words.map(function (word, i) {
      return '<span class="w" aria-hidden="true"><span style="--i:' + i + '">' + word + '</span></span>';
    }).join(' ');
  }

  /* ---------- Hero night sky (twinkling stars with mouse parallax) ---------- */
  (function sky() {
    var canvas = $('#sky');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var w = 0, h = 0, stars = [];
    var mx = 0, my = 0, px = 0, py = 0;
    var raf = null, visible = true;

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = hero.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.min(Math.round((w * h) / 6500), 260);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * 1.3 + 0.35,
          z: Math.random() * 0.9 + 0.1,
          p: Math.random() * Math.PI * 2,
          s: Math.random() * 0.02 + 0.005
        });
      }
      draw(0);
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      px += (mx - px) * 0.05;
      py += (my - py) * 0.05;

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        var alpha = reduceMotion ? 0.75 : 0.3 + 0.7 * Math.abs(Math.sin(s.p + t * s.s * 0.06));
        var x = (s.x + px * s.z * 26 + w) % w;
        var y = (s.y + py * s.z * 26 + h) % h;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = s.z > 0.82 ? '#F4B860' : '#EEEBF6';
        ctx.beginPath();
        ctx.arc(x, y, s.r * (0.6 + s.z * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function loop(t) {
      draw(t);
      raf = visible ? requestAnimationFrame(loop) : null;
    }

    function start() {
      if (reduceMotion || raf) return;
      raf = requestAnimationFrame(loop);
    }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
      }).observe(hero);
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    });

    resize();
    start();
  })();

  /* ---------- Scroll reveal ---------- */
  var revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Services accordion ---------- */
  $$('.service-head').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.service');
      var willOpen = !item.classList.contains('open');

      // Close the others so only one is open at a time
      $$('.service.open').forEach(function (other) {
        if (other !== item) {
          other.classList.remove('open');
          $('.service-head', other).setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
    });
  });

  /* ---------- Portfolio filter ---------- */
  var filterBtns = $$('.filter');
  var works = $$('.work');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.getAttribute('data-filter');

      filterBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
      });

      works.forEach(function (work) {
        var show = cat === 'all' || work.getAttribute('data-cat') === cat;
        work.classList.remove('pop');
        work.classList.toggle('hidden', !show);
        if (show) {
          void work.offsetWidth; // restart the animation
          work.classList.add('pop');
        }
      });
    });
  });

  /* ---------- Portfolio video upload preview ---------- */
  (function videoUpload() {
    $$('.video-input').forEach(function (input) {
      var video = $('#' + input.getAttribute('data-preview'));
      if (!video) return;

      input.addEventListener('change', function () {
        var file = input.files[0];
        if (!file) return;

        video.src = URL.createObjectURL(file);
        video.hidden = false;
        video.load();
      });
    });
  })();

  /* ---------- Portfolio image upload preview ---------- */
  (function imageUpload() {
    $$('.image-input').forEach(function (input) {
      var image = $('#' + input.getAttribute('data-preview'));
      if (!image) return;

      input.addEventListener('change', function () {
        var file = input.files[0];
        if (!file) return;

        image.src = URL.createObjectURL(file);
        image.hidden = false;
      });
    });
  })();

  /* ---------- Testimonials slider ---------- */
  (function slider() {
    var root = $('#slider');
    if (!root) return;

    var slides = $$('.slide', root);
    var dotsWrap = $('#dots');
    var index = 0;
    var timer = null;
    var dots = [];

    slides.forEach(function (_, i) {
      var d = document.createElement('button');
      d.className = 'dot';
      d.type = 'button';
      d.setAttribute('aria-label', 'Show testimonial ' + (i + 1));
      d.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(d);
      dots.push(d);
    });

    function go(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === index;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', String(!on));
      });
      dots.forEach(function (d, i) { d.setAttribute('aria-current', String(i === index)); });
    }

    function play() {
      if (reduceMotion) return;
      stop();
      timer = setInterval(function () { go(index + 1); }, 6500);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { play(); }

    $('#prev').addEventListener('click', function () { go(index - 1); restart(); });
    $('#next').addEventListener('click', function () { go(index + 1); restart(); });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', play);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', play);

    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(index - 1); restart(); }
      if (e.key === 'ArrowRight') { go(index + 1); restart(); }
    });

    // Swipe on touch screens
    var startX = null;
    root.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { go(index + (dx < 0 ? 1 : -1)); restart(); }
      startX = null;
    });

    go(0);
    play();
  })();

  /* ---------- Contact form ---------- */
  (function form() {
    var f = $('#contactForm');
    if (!f) return;

    var status = $('#formStatus');
    var btn = $('#submitBtn');

    function setError(id, msg) {
      var input = $('#' + id);
      var field = input.closest('.field');
      $('#' + id + 'Error').textContent = msg;
      field.classList.toggle('invalid', !!msg);
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      return !msg;
    }

    function validate() {
      var name = $('#name').value.trim();
      var email = $('#email').value.trim();
      var message = $('#message').value.trim();

      var okName = setError('name', name.length < 2 ? 'Please enter your name.' : '');
      var okEmail = setError('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? '' : 'Please enter a valid email address.');
      var okMsg = setError('message', message.length < 10 ? 'Please add a few details (at least 10 characters).' : '');
      return okName && okEmail && okMsg;
    }

    ['name', 'email', 'message'].forEach(function (id) {
      $('#' + id).addEventListener('input', function () { setError(id, ''); });
    });

    f.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.className = 'form-status';
      if (!validate()) return;

      btn.disabled = true;
      btn.textContent = 'Sending...';

      fetch('https://formspree.io/f/maenoogj', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(f)
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Form submission failed');
          return response.json();
        })
        .then(function () {
          var first = $('#name').value.trim().split(' ')[0];
          status.className = 'form-status sent';
          status.innerHTML = '<span class="status-mark" aria-hidden="true">&#10003;</span> Message launched, ' + first + '! We will be in touch within one business day.';
          f.reset();
          btn.disabled = false;
          btn.textContent = 'Send another message';
        })
        .catch(function () {
          status.className = 'form-status error-status';
          status.textContent = 'That did not go through. Please try again or email us directly.';
          btn.disabled = false;
          btn.textContent = 'Try again';
        });
    });
  })();

})();