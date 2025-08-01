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

    const dataISO = ultimoPagamento.data;
    const partesData = dataISO.split('-');
    const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : ultimoPagamento.data;

    return `<strong>Total de pagamentos: ${pagamentos.length}</strong><br />
            Último pagamento: ${ultimoPagamento.nome} em ${dataFormatada}`;
}

function criarDataSemFuso(dataStr) {
    const partes = dataStr.split('-'); // ['YYYY', 'MM', 'DD']
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
        const dataFormatada = d ?
            String(d.getDate()).padStart(2, '0') + '/' +
            String(d.getMonth() + 1).padStart(2, '0') + '/' +
            d.getFullYear()
            : 'N/A';

        detalhes += `<br>Inquilino: <strong>${nome}</strong> - Total Pago: R$ ${item.total.toFixed(2)} (${item.count} pagamento${item.count > 1 ? 's' : ''}) - Último pagamento: ${dataFormatada}`;
    }

    return `<strong>Total geral recebido: R$ ${totalGeral.toFixed(2)}</strong>${detalhes}`;
}

function gerarGraficoPagamentos(pagamentos) {
    if (!pagamentos || pagamentos.length === 0) return;

    const somaValores = {};
    pagamentos.forEach(p => {
        const valorPago = Number(p.valor) || 0; 
        somaValores[p.nome] = (somaValores[p.nome] || 0) + valorPago;
    });

    const ctx = document.getElementById('graficoPagamentos').getContext('2d');
    new Chart(ctx, {
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
                        callback: function (value) {
                            return 'R$ ' + value;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return 'R$ ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            }
        }
    });
}

async function iniciar() {
    const inquilinos = await carregarArquivo('inquilinos.json');
    const pagamentos = await carregarArquivo('pagamentos.json');

    document.getElementById('resumoInquilinos').innerHTML = gerarTabelaInquilinos(inquilinos);
    document.getElementById('resumoPagamentos').innerHTML = gerarResumoPagamentos(pagamentos);
    document.getElementById('resumoValores').innerHTML = gerarResumoValores(pagamentos);
    gerarGraficoPagamentos(pagamentos);
}

iniciar();