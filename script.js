const maskOptions = {
    money: {
        mask: 'R$ num',
        blocks: { num: { mask: Number, scale: 2, thousandsSeparator: '.', padFractionalZeros: true, radix: ',' } }
    }
};

async function carregarCidades() {
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/PR/municipios');
        const cidades = await response.json();
        const select = $('#cidade');
        cidades.forEach(c => select.append(new Option(c.nome, c.nome)));
        select.select2();
    } catch (e) { console.error("Erro ao carregar cidades", e); }
}

function parseMoeda(valor) {
    if (!valor) return 0;
    return Number(valor.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
}

function adicionarLinha() {
    const corpo = document.getElementById('corpoTabela');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Produto" onblur="calcularTotal()"></td>
        <td><input type="number" value="1" onchange="calcularTotal()"></td>
        <td><input type="text" class="money-item" placeholder="0,00" onblur="calcularTotal()"></td>
        <td><button class="btn-remove" onclick="this.parentElement.parentElement.remove(); calcularTotal();">×</button></td>
    `;
    corpo.appendChild(tr);
    IMask(tr.querySelector('.money-item'), maskOptions.money);
}

function calcularTotal() {
    let total = 0;
    document.querySelectorAll('#corpoTabela tr').forEach(linha => {
        const inputs = linha.querySelectorAll('input');
        const qtd = Number(inputs[1].value) || 0;
        const valor = parseMoeda(inputs[2].value);
        total += (qtd * valor);
    });

    const frete = parseMoeda(document.getElementById('frete').value);
    const desconto = parseMoeda(document.getElementById('desconto').value);
    const final = total + frete - desconto;

    document.getElementById('totalDisplay').innerText = final.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(14).setFont(undefined, 'bold');
    doc.text("MARCOS APARECIDO RODRIGUES", 105, 15, { align: "center" }); [cite: 8]
    doc.setFontSize(9).setFont(undefined, 'normal');
    doc.text("Avenida XV de Novembro, 1565 - São Carlos do Ivaí - PR [cite: 9]", 105, 21, { align: "center" });
    doc.text(`Cliente: ${document.getElementById('nomeCliente').value} | Cidade: ${document.getElementById('cidade').value}`, 10, 35); [cite: 12, 17]
    doc.text(`Pagamento: ${document.getElementById('metodoPagamento').value}`, 10, 40);

    const itens = [];
    document.querySelectorAll('#corpoTabela tr').forEach(l => {
        const i = l.querySelectorAll('input');
        itens.push([i[0].value, i[1].value, i[2].value, (Number(i[1].value) * parseMoeda(i[2].value)).toLocaleString('pt-BR', {style:'currency', currency:'BRL'})]);
    });

    doc.autoTable({
        startY: 45,
        head: [['PRODUTO', 'QTDE', 'VALOR UNIT.', 'TOTAL']], [cite: 19]
        body: itens,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] }
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont(undefined, 'bold').text(`TOTAL GERAL: ${document.getElementById('totalDisplay').innerText}`, 140, finalY); [cite: 24]
    doc.line(60, finalY + 30, 150, finalY + 30);
    doc.setFontSize(8).text("Responsável pelo recebimento", 105, finalY + 35, { align: "center" }); [cite: 20]

    doc.save(`Orcamento_${document.getElementById('nomeCliente').value || 'Cliente'}.pdf`);
}

$(document).ready(() => {
    carregarCidades();
    adicionarLinha();
    IMask(document.getElementById('frete'), maskOptions.money);
    IMask(document.getElementById('desconto'), maskOptions.money);
});