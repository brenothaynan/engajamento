// ===== CONFIGURAÇÕES =====
const ATIVIDADES = [
    'Acessos','Financeiro','Acadêmico','Teams','Sava',
    'SIA','Financeiro 2','Avaliações','Simulados','AV e AVS',
    'Socioemocional','Progresso','Renovação','Aceite de Contrato','Nota Final'
];

// ===== ELEMENTOS HTML =====
const form = document.getElementById('form-novo-aluno');
const inputNome = document.getElementById('nome-aluno');
const inputMatricula = document.getElementById('matricula-aluno');
const inputTelefone = document.getElementById('telefone-aluno');
const filtroNome = document.getElementById('filtro-nome');
const listaAlunosDiv = document.getElementById('lista-alunos');
const infoStatus = document.getElementById('info-status');
const btnRemoverTodos = document.getElementById('btn-remover-todos');
const btnExportarJson = document.getElementById('btn-exportar-json');
const btnExportarPdf = document.getElementById('btn-exportar-pdf');
const btnImportar = document.getElementById('btn-importar');
const inputImportar = document.getElementById('input-importar');
const headerLista = document.getElementById('header-lista');

// ===== BASE DE DADOS =====
let alunos = JSON.parse(localStorage.getItem('baseAlunos')) || [];

// ===== FUNÇÕES =====
function salvarDados() {
    localStorage.setItem('baseAlunos', JSON.stringify(alunos));
}

function atualizarStatus() {
    const total = alunos.length;
    const concluidas = alunos.filter(a => Object.values(a.atividades).every(v => v)).length;
    infoStatus.textContent = total === 0
        ? 'Nenhum aluno cadastrado.'
        : `Total: ${total} aluno(s) — ${concluidas} com todas as atividades concluídas.`;
}

function montarCabecalho() {
    headerLista.innerHTML = '';
    ['Nome', 'Matrícula', 'Telefone', ...ATIVIDADES, '%', 'Ação'].forEach(texto => {
        const span = document.createElement('span');
        span.textContent = texto;
        headerLista.appendChild(span);
    });
}

function renderizarAlunos(filtro = '') {
    listaAlunosDiv.innerHTML = '';
    let alunosFiltrados = alunos.filter(a => a.nome.toLowerCase().includes(filtro.toLowerCase()));

    if (alunosFiltrados.length === 0) {
        listaAlunosDiv.innerHTML = '<p style="text-align:center; color:#888; padding:20px;">Nenhum aluno encontrado.</p>';
        atualizarStatus();
        return;
    }

    alunosFiltrados.sort((a,b) => a.nome.localeCompare(b.nome));

    alunosFiltrados.forEach(aluno => {
        const item = document.createElement('div');
        item.className = 'aluno-item';

        const spanNome = document.createElement('span');
        spanNome.textContent = aluno.nome;
        item.appendChild(spanNome);

        const spanMatricula = document.createElement('span');
        spanMatricula.textContent = aluno.matricula;
        item.appendChild(spanMatricula);

        const spanTelefone = document.createElement('span');
        spanTelefone.textContent = aluno.telefone;
        item.appendChild(spanTelefone);

        let totalConcluidas = 0;

        ATIVIDADES.forEach(nomeAtividade => {
            const check = document.createElement('input');
            check.type = 'checkbox';
            check.checked = aluno.atividades[nomeAtividade] || false;
            if (check.checked) totalConcluidas++;
            check.addEventListener('change', () => toggleAtividade(aluno.id, nomeAtividade, check.checked));
            item.appendChild(check);
        });

        const perc = Math.round((totalConcluidas / ATIVIDADES.length) * 100);
        const spanPerc = document.createElement('span');
        spanPerc.className = 'porcentagem';
        spanPerc.textContent = perc + '%';
        item.appendChild(spanPerc);

        const btnRemover = document.createElement('button');
        btnRemover.className = 'btn-remover';
        btnRemover.textContent = 'Remover';
        btnRemover.addEventListener('click', () => removerAluno(aluno.id));
        item.appendChild(btnRemover);

        if (perc === 100) item.classList.add('completo');
        listaAlunosDiv.appendChild(item);
    });

    atualizarStatus();
}

function adicionarAluno(event) {
    event.preventDefault();
    const nome = inputNome.value.trim();
    const matricula = inputMatricula.value.trim();
    const telefone = inputTelefone.value.trim();

    if (!nome || !matricula || !telefone) return;

    if (alunos.some(a => a.nome.toLowerCase() === nome.toLowerCase() && a.matricula === matricula)) {
        alert('Esse aluno já está cadastrado!');
        return;
    }

    const atividadesObj = {};
    ATIVIDADES.forEach(a => atividadesObj[a] = false);

    const novoAluno = { id: Date.now(), nome, matricula, telefone, atividades: atividadesObj };
    alunos.push(novoAluno);
    inputNome.value = '';
    inputMatricula.value = '';
    inputTelefone.value = '';
    salvarDados();
    renderizarAlunos(filtroNome.value);
}

function toggleAtividade(alunoId, nomeAtividade, estado) {
    const aluno = alunos.find(a => a.id === alunoId);
    if (aluno) {
        aluno.atividades[nomeAtividade] = estado;
        salvarDados();
        renderizarAlunos(filtroNome.value);
    }
}

function removerAluno(alunoId) {
    alunos = alunos.filter(a => a.id !== alunoId);
    salvarDados();
    renderizarAlunos(filtroNome.value);
}

function removerTodos() {
    if (confirm('Tem certeza que deseja remover todos os alunos?')) {
        alunos = [];
        salvarDados();
        renderizarAlunos();
    }
}

function exportarJSON() {
    if (alunos.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }
    const blob = new Blob([JSON.stringify(alunos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'alunos_backup.json';
    link.click();
    URL.revokeObjectURL(url);
}

function exportarPDF() {
    if (alunos.length === 0) {
        alert('Não há dados para exportar.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let y = 10;
    doc.setFontSize(12);
    doc.text("Lista de Alunos", 105, y, {align: "center"});
    y += 10;

    alunos.forEach(aluno => {
        doc.text(`Nome: ${aluno.nome}`, 10, y);
        doc.text(`Matrícula: ${aluno.matricula}`, 80, y);
        doc.text(`Telefone: ${aluno.telefone}`, 150, y);
        y += 8;
    });

    doc.save('alunos.pdf');
}

function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const dadosImportados = JSON.parse(e.target.result);
            if (Array.isArray(dadosImportados)) {
                alunos = dadosImportados;
                salvarDados();
                renderizarAlunos();
                alert('Dados importados com sucesso!');
            } else {
                alert('O arquivo não possui um formato válido.');
            }
        } catch {
            alert('Erro ao ler o arquivo. Certifique-se de que é um JSON válido.');
        }
    };
    reader.readAsText(file);
}

// ===== EVENTOS =====
form.addEventListener('submit', adicionarAluno);
filtroNome.addEventListener('input', () => renderizarAlunos(filtroNome.value));
btnRemoverTodos.addEventListener('click', removerTodos);
btnExportarJson.addEventListener('click', exportarJSON);
btnExportarPdf.addEventListener('click', exportarPDF);
btnImportar.addEventListener('click', () => inputImportar.click());
inputImportar.addEventListener('change', importarDados);

// ===== INICIALIZAÇÃO =====
montarCabecalho();
renderizarAlunos();
