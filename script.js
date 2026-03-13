const moneyMask = {
    mask: 'R$ num',
    blocks: { num: { mask: Number, scale: 2, thousandsSeparator: '.', padFractionalZeros: true, radix: ',' } }
};

async function carregarCidades() {
    try {
        const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/PR/municipios');
        const dados = await res.json();
        const select = $('#cidade');
        dados.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(c => select.append(new Option(c.nome, c.nome)));
        select.select2();
    } catch (e) { console.error("Erro cidades", e); }
}

function parseMoeda(v) {
    if(!v) return 0;
    return parseFloat(v.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
}

function adicionarLinha() {
    const tbody = document.getElementById('corpoTabela');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Produto" onblur="calcularTotal()"></td>
        <td><input type="number" value="1" min="1" onchange="calcularTotal()"></td>
        <td><input type="text" class="money-item" placeholder="0,00" onblur="calcularTotal()"></td>
        <td><button class="btn-remove" onclick="this.parentElement.parentElement.remove(); calcularTotal()">×</button></td>
    `;
    tbody.appendChild(tr);
    IMask(tr.querySelector('.money-item'), moneyMask);
}

function calcularTotal() {
    let sub = 0;
    document.querySelectorAll('#corpoTabela tr').forEach(linha => {
        const inp = linha.querySelectorAll('input');
        sub += (parseFloat(inp[1].value) || 0) * parseMoeda(inp[2].value);
    });
    const frete = parseMoeda(document.getElementById('frete').value);
    const desc = parseMoeda(document.getElementById('desconto').value);
    const total = sub + frete - desc;
    document.getElementById('totalDisplay').innerText = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header conforme Document.pdf
    doc.setFontSize(14).setFont(undefined, 'bold');
    doc.text("MARCOS APARECIDO RODRIGUES", 105, 15, { align: "center" });
    doc.setFontSize(9).setFont(undefined, 'normal');
    doc.text("Avenida XV de Novembro, 1565 - São Carlos do Ivaí - PR - CEP: 87770-000", 105, 21, { align: "center" });
    doc.text("Bairro: Conjunto Bela Vista - Fone: (44) 99723-1252", 105, 26, { align: "center" });
    doc.line(15, 30, 195, 30);

    // Cliente
    doc.setFontSize(10).setFont(undefined, 'bold');
    doc.text(`Cliente: ${document.getElementById('nomeCliente').value}`, 15, 40);
    doc.setFont(undefined, 'normal');
    doc.text(`CPF/CNPJ: ${document.getElementById('cpfCnpj').value} | RG/IE: ${document.getElementById('rgIe').value}`, 15, 46);
    doc.text(`Cel: ${document.getElementById('celular').value} | Fone: ${document.getElementById('foneFixo').value}`, 15, 52);
    doc.text(`Endereço: ${document.getElementById('endereco').value}`, 15, 58);
    doc.text(`Cidade: ${document.getElementById('cidade').value} - PR`, 15, 64);
    doc.text(`Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 150, 40);

    const rows = [];
    document.querySelectorAll('#corpoTabela tr').forEach(tr => {
        const i = tr.querySelectorAll('input');
        const t = (parseFloat(i[1].value) || 0) * parseMoeda(i[2].value);
        rows.push([i[0].value, i[1].value, i[2].value, t.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})]);
    });

    doc.autoTable({
        startY: 70,
        head: [['PRODUTO', 'QTDE', 'VALOR', 'TOTAL']],
        body: rows,
        theme: 'grid',
        styles: { cellPadding: 4, fontSize: 9 },
        headStyles: { fillColor: [40, 40, 40] }
    });

    let finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont(undefined, 'bold');
    doc.text(`SUB-TOTAL: ${document.getElementById('totalDisplay').innerText}`, 140, finalY);
    doc.text(`TOTAL: ${document.getElementById('totalDisplay').innerText}`, 140, finalY + 10);

    doc.line(15, finalY + 30, 90, finalY + 30);
    doc.setFontSize(8).setFont(undefined, 'normal');
    doc.text("Responsável pelo recebimento", 15, finalY + 35);

    doc.save(`Orcamento_${document.getElementById('nomeCliente').value || 'Cliente'}.pdf`);
}

$(document).ready(() => {
    carregarCidades();
    adicionarLinha();
    IMask(document.getElementById('cpfCnpj'), { mask: [{mask:'000.000.000-00'}, {mask:'00.000.000/0000-00'}] });
    IMask(document.getElementById('celular'), { mask: '(00) 00000-0000' });
    IMask(document.getElementById('foneFixo'), { mask: '(00) 0000-0000' });
    IMask(document.getElementById('frete'), moneyMask);
    IMask(document.getElementById('desconto'), moneyMask);
});