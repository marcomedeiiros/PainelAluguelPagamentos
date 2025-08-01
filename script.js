let inquilinos = [];
let pagamentos = [];

async function carregarArquivo(nomeArquivo) {
    try {
        const res = await fetch(nomeArquivo);
        if (!res.ok) throw new Error(`Erro ao carregar ${nomeArquivo}`);
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
}

function calcularPeriodoEntreDatas(inicio, fim) {
    const dataInicio = new Date(Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), inicio.getUTCDate()));
    const dataFim = new Date(Date.UTC(fim.getUTCFullYear(), fim.getUTCMonth(), fim.getUTCDate()));

    let anos = dataFim.getUTCFullYear() - dataInicio.getUTCFullYear();
    let meses = dataFim.getUTCMonth() - dataInicio.getUTCMonth();
    let dias = dataFim.getUTCDate() - dataInicio.getUTCDate();

    if (dias < 0) {
        meses -= 1;
        const ultimoDiaMesAnterior = new Date(Date.UTC(dataFim.getUTCFullYear(), dataFim.getUTCMonth(), 0)).getUTCDate();
        dias += ultimoDiaMesAnterior;
    }

    if (meses < 0) {
        anos -= 1;
        meses += 12;
    }

    const partes = [];
    if (anos > 0) partes.push(`${anos} ano${anos > 1 ? 's' : ''}`);
    if (meses > 0) partes.push(`${meses} mes${meses > 1 ? 'es' : ''}`);
    if (dias > 0) partes.push(`${dias} dia${dias > 1 ? 's' : ''}`);
    if (partes.length === 0) return '0 dias';

    return partes.join(', ');
}

function gerarTabelaInquilinos(inquilinos) {
    if (!inquilinos || inquilinos.length === 0) {
        return '<p>Nenhum inquilino registrado ainda.</p>';
    }

    let html = `
  <strong>Total de inquilinos: ${inquilinos.length}</strong>
  <table>
    <thead>
      <tr>
        <th>Nome</th>
        <th>Telefone</th>
        <th>Email</th>
        <th>Início</th>
        <th>Saída</th>
        <th>Tempo de Moradia</th>
      </tr>
    </thead>
    <tbody>
  `;

    inquilinos.forEach(i => {
        const [diaI, mesI, anoI] = i.data_inicio.split('/');
        const dataInicio = new Date(Date.UTC(parseInt(anoI), parseInt(mesI) - 1, parseInt(diaI)));

        let dataFinal;
        if (i.data_saida && i.data_saida.toUpperCase() !== 'N/A') {
            const [diaF, mesF, anoF] = i.data_saida.split('/');
            dataFinal = new Date(Date.UTC(parseInt(anoF), parseInt(mesF) - 1, parseInt(diaF)));
        } else {
            const agora = new Date();
            dataFinal = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
        }

        const duracao = calcularPeriodoEntreDatas(dataInicio, dataFinal);

        html += `
    <tr>
      <td>${i.nome}</td>
      <td>${i.telefone}</td>
      <td>${i.email}</td>
      <td>${i.data_inicio}</td>
      <td>${i.data_saida || 'N/A'}</td>
      <td>${duracao}</td>
    </tr>
    `;
    });

    html += '</tbody></table>';
    return html;
}

function gerarResumoPagamentos(pagamentos) {
    if (!pagamentos || pagamentos.length === 0) {
        return '<p>Nenhum pagamento registrado ainda.</p>';
    }

    const ultimoPagamento = pagamentos[pagamentos.length - 1];
    const partesData = ultimoPagamento.data.split('-');
    const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : ultimoPagamento.data;

    return `<strong>Total de pagamentos: ${pagamentos.length}</strong><br />
          Último pagamento: ${ultimoPagamento.nome} em ${dataFormatada}`;
}

function criarDataSemFuso(dataStr) {
    const partes = dataStr.split('-');
    return new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
}

function gerarResumoValores(pagamentos) {
    if (!pagamentos || pagamentos.length === 0) {
        return '<p>Nenhum pagamento registrado ainda.</p>';
    }

    const totalGeral = pagamentos.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
    const resumoPorNome = {};

    pagamentos.forEach(p => {
        if (!resumoPorNome[p.nome]) {
            resumoPorNome[p.nome] = { total: 0, count: 0, ultimaData: null };
        }
        resumoPorNome[p.nome].total += parseFloat(p.valor) || 0;
        resumoPorNome[p.nome].count += 1;

        const dataAtual = criarDataSemFuso(p.data);
        if (!resumoPorNome[p.nome].ultimaData || dataAtual > resumoPorNome[p.nome].ultimaData) {
            resumoPorNome[p.nome].ultimaData = dataAtual;
        }
    });

    let detalhes = '';
    for (const nome in resumoPorNome) {
        const item = resumoPorNome[nome];
        const d = item.ultimaData;
        const dataFormatada = d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : 'N/A';

        detalhes += `<br>Inquilino: <strong>${nome}</strong> - Total Pago: R$ ${item.total.toFixed(2)} (${item.count} pagamento${item.count > 1 ? 's' : ''}) - Último pagamento: ${dataFormatada}`;
    }

    return `<strong>Total geral recebido: R$ ${totalGeral.toFixed(2)}</strong>${detalhes}`;
}

function gerarGraficoPizzaResumo(pagamentos, inquilinos) {
    const resumoGeral = {};

    inquilinos.forEach(i => {
        resumoGeral[i.nome] = 0;
    });

    pagamentos.forEach(p => {
        if (resumoGeral.hasOwnProperty(p.nome)) {
            resumoGeral[p.nome] += parseFloat(p.valor || 0);
        }
    });

    const ctx = document.getElementById('graficoPizzaResumo').getContext('2d');

    if (window.graficoPizza) window.graficoPizza.destroy();

    window.graficoPizza = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(resumoGeral),
            datasets: [{
                data: Object.values(resumoGeral),
                backgroundColor: [
                    '#4f46e5', '#9333ea', '#10b981', '#f59e0b',
                    '#ef4444', '#3b82f6', '#f97316', '#22d3ee'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const valor = context.parsed;
                            return `${context.label}: R$ ${valor.toFixed(2)}`;
                        }
                    }
                }
            }
        }
    });
}

function gerarResumoTexto(pagamentos, inquilinos) {
    const resumoPorInquilino = {};

    inquilinos.forEach(i => {
        resumoPorInquilino[i.nome] = {
            totalPago: 0,
            quantidade: 0,
            ultimoPagamentoData: null
        };
    });

    pagamentos.forEach(p => {
        if (resumoPorInquilino.hasOwnProperty(p.nome)) {
            resumoPorInquilino[p.nome].totalPago += parseFloat(p.valor || 0);
            resumoPorInquilino[p.nome].quantidade += 1;

            const dataPagamento = new Date(p.data);
            const ultimoDataAtual = resumoPorInquilino[p.nome].ultimoPagamentoData
                ? new Date(resumoPorInquilino[p.nome].ultimoPagamentoData)
                : null;

            if (!ultimoDataAtual || dataPagamento > ultimoDataAtual) {
                resumoPorInquilino[p.nome].ultimoPagamentoData = p.data;
            }
        }
    });

    let ultimoPagamento = null;
    pagamentos.forEach(p => {
        if (!ultimoPagamento || new Date(p.data) > new Date(ultimoPagamento.data)) {
            ultimoPagamento = p;
        }
    });

    const totalGeralRecebido = pagamentos.reduce((acc, p) => acc + parseFloat(p.valor || 0), 0);

    let textoResumo = `Pagamentos:\n`;
    pagamentos.forEach(p => {
        textoResumo += `- ${p.nome} em ${formatarData(p.data)}: R$ ${parseFloat(p.valor).toFixed(2)}\n`;
    });

    textoResumo += `\nÚltimo pagamento: ${ultimoPagamento.nome} em ${formatarData(ultimoPagamento.data)}\n`;
    textoResumo += `Total geral recebido: R$ ${totalGeralRecebido.toFixed(2)}\n\n`;

    Object.entries(resumoPorInquilino).forEach(([nome, info]) => {
        if (info.quantidade > 0) {
            textoResumo += `Inquilino: ${nome} - Total Pago: R$ ${info.totalPago.toFixed(2)} (${info.quantidade} pagamento${info.quantidade > 1 ? 's' : ''}) - Último pagamento: ${formatarData(info.ultimoPagamentoData)}\n`;
        }
    });

    return textoResumo;
}

function formatarData(dataISO) {
    const d = new Date(dataISO);
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const ano = d.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
}

function gerarGraficoPagamentos(pagamentos) {
    if (!pagamentos || pagamentos.length === 0) return;

    const somaValores = {};
    pagamentos.forEach(p => {
        const valorPago = Number(p.valor) || 0;
        somaValores[p.nome] = (somaValores[p.nome] || 0) + valorPago;
    });

    const ctx = document.getElementById('graficoPagamentos').getContext('2d');
    if (window.graficoBarra) window.graficoBarra.destroy();

    window.graficoBarra = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(somaValores),
            datasets: [{
                label: 'Total pago (R$)',
                data: Object.values(somaValores),
                backgroundColor: 'rgba(79, 70, 229, 0.7)'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 100,
                        callback: value => 'R$ ' + value
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: context => 'R$ ' + context.parsed.y.toFixed(2)
                    }
                }
            }
        }
    });
}

async function iniciar() {
    inquilinos = await carregarArquivo('inquilinos.json') || [];
    pagamentos = await carregarArquivo('pagamentos.json') || [];

    document.getElementById('resumoInquilinos').innerHTML = gerarTabelaInquilinos(inquilinos);
    document.getElementById('resumoPagamentos').innerHTML = gerarResumoPagamentos(pagamentos);
    document.getElementById('resumoValores').innerHTML = gerarResumoValores(pagamentos);
    gerarGraficoPagamentos(pagamentos);
    gerarGraficoPizzaResumo(pagamentos, inquilinos);
}

async function baixarResumoPDF() {
    if (!inquilinos.length || !pagamentos.length) {
        alert("Dados ainda não carregados!");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Resumo Mensal de Aluguéis", 20, 20);

    const resumoTexto = gerarResumoTexto(pagamentos, inquilinos);

    doc.setFontSize(12);
    const linhas = doc.splitTextToSize(resumoTexto, 170);
    doc.text(linhas, 20, 30);

    const canvas = document.getElementById('graficoPizzaResumo');
    const imgData = canvas.toDataURL('image/png');

    const yGrafico = 30 + linhas.length * 7 + 10;
    doc.addImage(imgData, 'PNG', 20, yGrafico, 160, 120);

    doc.save("resumo-mensal.pdf");
}

setInterval(async () => {
    const novosInquilinos = await carregarArquivo('inquilinos.json');
    const novosPagamentos = await carregarArquivo('pagamentos.json');

    if (JSON.stringify(novosInquilinos) !== JSON.stringify(inquilinos) ||
        JSON.stringify(novosPagamentos) !== JSON.stringify(pagamentos)) {
        
        inquilinos = novosInquilinos;
        pagamentos = novosPagamentos;

        document.getElementById('resumoInquilinos').innerHTML = gerarTabelaInquilinos(inquilinos);
        document.getElementById('resumoPagamentos').innerHTML = gerarResumoPagamentos(pagamentos);
        document.getElementById('resumoValores').innerHTML = gerarResumoValores(pagamentos);
        gerarGraficoPagamentos(pagamentos);
        gerarGraficoPizzaResumo(pagamentos, inquilinos);
        console.log("Dados atualizados automaticamente");
    }
}, 10000); 

iniciar();