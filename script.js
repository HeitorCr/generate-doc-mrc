const moneyMaskConfig = {
    mask: 'R$ num',
    blocks: {
        num: {
            mask: Number,
            scale: 2,
            thousandsSeparator: '.',
            padFractionalZeros: true,
            radix: ','
        }
    }
};

async function carregarCidades() {
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/PR/municipios');
        const cidades = await response.json();
        const select = $('#cidade');
        cidades.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(c => {
            select.append(new Option(c.nome, c.nome));
        });
        select.select2({ placeholder: "Selecione a cidade" });
    } catch (error) { console.error("Erro IBGE:", error); }
}

function parseMoeda(valor) {
    if (!valor) return 0;
    let limpo = valor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(limpo) || 0;
}

function adicionarLinha() {
    const corpo = document.getElementById('corpoTabela');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Nome do produto" onblur="calcularTotal()"></td>
        <td><input type="number" value="1" min="1" onchange="calcularTotal()"></td>
        <td><input type="text" class="money-row" placeholder="R$ 0,00" onblur="calcularTotal()"></td>
        <td style="text-align: center;"><button class="btn-remove" onclick="this.parentElement.parentElement.remove(); calcularTotal();">×</button></td>
    `;
    corpo.appendChild(tr);
    IMask(tr.querySelector('.money-row'), moneyMaskConfig);
}

function calcularTotal() {
    let subtotal = 0;
    document.querySelectorAll('#corpoTabela tr').forEach(linha => {
        const inp = linha.querySelectorAll('input');
        const qtd = parseFloat(inp[1].value) || 0;
        const vlr = parseMoeda(inp[2].value);
        subtotal += (qtd * vlr);
    });

    const frete = parseMoeda(document.getElementById('frete').value);
    const desconto = parseMoeda(document.getElementById('desconto').value);
    const totalFinal = subtotal + frete - desconto;

    document.getElementById('totalDisplay').innerText = totalFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(16).setFont(undefined, 'bold');
    doc.text("MARCOS APARECIDO RODRIGUES", 105, 15, { align: "center" });
    doc.setFontSize(10).setFont(undefined, 'normal');
    doc.text("Avenida XV de Novembro, 1565 - São Carlos do Ivaí - PR", 105, 22, { align: "center" });
    
    doc.setFontSize(10).setFont(undefined, 'bold');
    doc.text("DADOS DO CLIENTE", 15, 35);
    doc.setFont(undefined, 'normal');
    doc.text(`Cliente: ${document.getElementById('nomeCliente').value}`, 15, 42);
    doc.text(`CPF/CNPJ: ${document.getElementById('cpfCnpj').value}`, 15, 47);
    doc.text(`Fone: ${document.getElementById('celular').value}`, 15, 52);
    doc.text(`Cidade: ${document.getElementById('cidade').value} - PR`, 15, 57);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 150, 42);

    const rows = [];
    document.querySelectorAll('#corpoTabela tr').forEach(tr => {
        const inp = tr.querySelectorAll('input');
        const sub = (parseFloat(inp[1].value) * parseMoeda(inp[2].value));
        rows.push([inp[0].value, inp[1].value, inp[2].value, sub.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})]);
    });

    doc.autoTable({
        startY: 65,
        head: [['PRODUTO', 'QTDE', 'UNITÁRIO', 'TOTAL']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [30, 41, 59] }
    });

    let posY = doc.lastAutoTable.finalY + 15;
    doc.setFont(undefined, 'bold').text(`PAGAMENTO: ${document.getElementById('metodoPagamento').value}`, 15, posY);
    doc.text(`TOTAL GERAL: ${document.getElementById('totalDisplay').innerText}`, 130, posY);
    
    doc.save(`Orcamento_${document.getElementById('nomeCliente').value || 'Cliente'}.pdf`);
}

$(document).ready(() => {
    carregarCidades();
    adicionarLinha();
    
    // Aplicar máscaras nos campos fixos
    IMask(document.getElementById('cpfCnpj'), {
        mask: [{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }]
    });
    IMask(document.getElementById('celular'), { mask: '(00) 00000-0000' });
    IMask(document.getElementById('frete'), moneyMaskConfig);
    IMask(document.getElementById('desconto'), moneyMaskConfig);
});