(function () {
  'use strict';

  /* ---------- localStorage seguro ---------- */
  function ler(chave, padrao) {
    try { var v = localStorage.getItem(chave); return v ? JSON.parse(v) : padrao; }
    catch (e) { return padrao; }
  }
  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); return true; }
    catch (e) { return false; }
  }
  function escapar(t) {
    var d = document.createElement('div'); d.textContent = t; return d.innerHTML;
  }

  /* ---------- Tema claro/escuro (persistido) ---------- */
  var raiz = document.documentElement;
  var tema = ler('tema', null);
  if (!tema) tema = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  raiz.setAttribute('data-tema', tema);
  var btnTema = document.getElementById('btn-tema');
  if (btnTema) {
    btnTema.textContent = tema === 'escuro' ? 'Tema claro' : 'Tema escuro';
    btnTema.addEventListener('click', function () {
      tema = tema === 'escuro' ? 'claro' : 'escuro';
      raiz.setAttribute('data-tema', tema);
      gravar('tema', tema);
      btnTema.textContent = tema === 'escuro' ? 'Tema claro' : 'Tema escuro';
    });
  }

  /* ---------- Metas de estudo (feature interativa) ---------- */
  var formMetas = document.getElementById('form-metas');
  if (formMetas) {
    var metas = ler('metas', []);
    var lista = document.getElementById('lista-metas');
    var msg = document.getElementById('msg-metas');
    var contador = document.getElementById('contador-metas');
    var input = document.getElementById('nova-meta');

    function avisar(texto, ok) {
      msg.textContent = texto;
      msg.className = 'feedback ' + (ok ? 'ok' : 'erro-msg');
    }
    function desenhar() {
      lista.innerHTML = '';
      if (metas.length === 0) {
        lista.innerHTML = '<li>Nenhuma meta ainda. Adicione a primeira acima.</li>';
      }
      metas.forEach(function (m, i) {
        var li = document.createElement('li');
        if (m.feita) li.className = 'feita';
        li.innerHTML = '<input type="checkbox" id="m' + i + '"' + (m.feita ? ' checked' : '') +
          ' aria-label="Concluir meta"><span>' + escapar(m.texto) +
          '</span><button type="button" data-i="' + i + '" aria-label="Excluir meta">Excluir</button>';
        li.querySelector('input').addEventListener('change', function (e) {
          metas[i].feita = e.target.checked; gravar('metas', metas); desenhar();
        });
        li.querySelector('button').addEventListener('click', function () {
          metas.splice(i, 1); gravar('metas', metas); desenhar(); avisar('Meta excluída.', true);
        });
        lista.appendChild(li);
      });
      var feitas = metas.filter(function (m) { return m.feita; }).length;
      contador.textContent = feitas + ' de ' + metas.length + ' metas concluídas.';
    }
    formMetas.addEventListener('submit', function (e) {
      e.preventDefault();
      var texto = input.value.trim();
      if (texto.length < 3) { avisar('Digite uma meta com pelo menos 3 caracteres.', false); input.focus(); return; }
      metas.push({ texto: texto, feita: false });
      gravar('metas', metas);
      input.value = '';
      desenhar();
      avisar('Meta adicionada e salva neste navegador.', true);
    });
    document.getElementById('limpar-concluidas').addEventListener('click', function () {
      metas = metas.filter(function (m) { return !m.feita; });
      gravar('metas', metas); desenhar(); avisar('Metas concluídas removidas.', true);
    });
    desenhar();
  }

  /* ---------- Formulário de contato ---------- */
  var formContato = document.getElementById('form-contato');
  if (formContato) {
    var regras = {
      nome: function (v) { return v.trim().length >= 3 ? '' : 'Informe seu nome com pelo menos 3 letras.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'Informe um e-mail válido, como nome@dominio.com.'; },
      assunto: function (v) { return v ? '' : 'Escolha um assunto.'; },
      mensagem: function (v) { return v.trim().length >= 10 ? '' : 'Escreva uma mensagem com pelo menos 10 caracteres.'; }
    };
    function validar(campo) {
      var el = document.getElementById(campo);
      var erro = regras[campo](el.value);
      document.getElementById('erro-' + campo).textContent = erro;
      el.parentNode.classList.toggle('invalido', !!erro);
      el.setAttribute('aria-invalid', erro ? 'true' : 'false');
      return !erro;
    }
    Object.keys(regras).forEach(function (c) {
      document.getElementById(c).addEventListener('blur', function () { validar(c); });
    });
    var listaMsgs = document.getElementById('lista-mensagens');
    function mostrarMsgs() {
      var msgs = ler('mensagens', []);
      listaMsgs.innerHTML = msgs.length ? '' : '<li>Nenhuma mensagem enviada ainda.</li>';
      msgs.forEach(function (m) {
        var li = document.createElement('li');
        li.innerHTML = '<strong>' + escapar(m.assunto) + '</strong> — ' + escapar(m.nome) +
          ' (' + escapar(m.data) + ')<br>' + escapar(m.mensagem);
        listaMsgs.appendChild(li);
      });
    }
    formContato.addEventListener('submit', function (e) {
      e.preventDefault();
      var fb = document.getElementById('msg-form');
      var todosOk = Object.keys(regras).map(validar).every(Boolean);
      if (!todosOk) {
        fb.textContent = 'Corrija os campos destacados e envie novamente.';
        fb.className = 'feedback erro-msg';
        var primeiro = formContato.querySelector('[aria-invalid="true"]');
        if (primeiro) primeiro.focus();
        return;
      }
      var msgs = ler('mensagens', []);
      msgs.unshift({
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        assunto: document.getElementById('assunto').value,
        mensagem: document.getElementById('mensagem').value.trim(),
        data: new Date().toLocaleString('pt-BR')
      });
      gravar('mensagens', msgs);
      formContato.reset();
      fb.textContent = 'Mensagem enviada com sucesso! Ela foi salva neste navegador.';
      fb.className = 'feedback ok';
      mostrarMsgs();
    });
    mostrarMsgs();
  }

  /* ---------- Gráfico de barras ---------- */
  var grafico = document.getElementById('grafico');
  if (grafico) {
    var dados = [['HTML', 90], ['CSS', 80], ['JavaScript', 65], ['Git', 60], ['Acessibilidade', 55]];
    var tbody = document.getElementById('tabela-dados');
    dados.forEach(function (d) {
      var b = document.createElement('div');
      b.className = 'barra'; b.tabIndex = 0; b.title = d[0] + ': ' + d[1] + '%';
      b.innerHTML = '<span>' + d[0] + '</span><div class="trilho"><div class="preenche"></div></div><span>' + d[1] + '%</span>';
      grafico.appendChild(b);
      tbody.insertAdjacentHTML('beforeend', '<tr><td>' + d[0] + '</td><td>' + d[1] + '%</td></tr>');
      setTimeout(function () { b.querySelector('.preenche').style.width = d[1] + '%'; }, 50);
    });
  }
})();
