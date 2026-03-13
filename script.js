// Configuração global da máscara de dinheiro
const maskMoneyConfig = {
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

// Carregar Cidades via API
async function carregarCidades() {
    try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados/PR/municipios');
        const cidades = await response.json();
        const select = $('#cidade');
        cidades.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(c => {
            select.append(new Option(c.nome, c.nome));
        });
        select.select2();
    } catch (error) {
        console.error("Erro ao buscar cidades:", error);
    }
}

// Converte string de moeda para número utilizável em cálculos
function parseMoeda(valor) {
    if (!valor) return 0;
    let limpo = valor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    return parseFloat(limpo) || 0;
}

// Adiciona nova linha de produto
function adicionarLinha() {
    const corpo = document.getElementById('corpoTabela');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Ex: Poste" onblur="calcularTotal()"></td>
        <td><input type="number" value="1" min="1" onchange="calcularTotal()"></td>
        <td><input type="text" class="money-row" placeholder="0,00" onblur="calcularTotal()"></td>
        <td style="text-align: center;"><button class="btn-remove" onclick="this.parentElement.parentElement.remove(); calcularTotal();">×</button></td>
    `;
    corpo.appendChild(tr);
    IMask(tr.querySelector('.money-row'), maskMoneyConfig);
}

// Calcula o total em tempo real
function calcularTotal() {
    let subtotal = 0;
    document.querySelectorAll('#corpoTabela tr').forEach(linha => {
        const inputs = linha.querySelectorAll('input');
        const qtd = parseFloat(inputs[1].value) || 0;
        const valor = parseMoeda(inputs[2].value);
        subtotal += (qtd * valor);
    });

    const frete = parseMoeda(document.getElementById('frete').value);
    const desconto = parseMoeda(document.getElementById('desconto').value);
    const totalFinal = subtotal + frete - desconto;

    document.getElementById('totalDisplay').innerText = totalFinal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Gera o arquivo PDF
function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(16).setFont(undefined, 'bold');
    doc.text("MARCOS APARECIDO RODRIGUES", 105, 15, { align: "center" });
    doc.setFontSize(10).setFont(undefined, 'normal');
    doc.text("Avenida XV de Novembro, 1565 - São Carlos do Ivaí - PR", 105, 22, { align: "center" });
    
    // Info Cliente
    doc.setFontSize(11);
    doc.text(`Cliente: ${document.getElementById('nomeCliente').value}`, 15, 35);
    doc.text(`Cidade: ${document.getElementById('cidade').value} - PR`, 15, 41);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 150, 35);

    // Tabela
    const rows = [];
    document.querySelectorAll('#corpoTabela tr').forEach(tr => {
        const inp = tr.querySelectorAll('input');
        const sub = (parseFloat(inp[1].value) * parseMoeda(inp[2].value));
        rows.push([inp[0].value, inp[1].value, inp[2].value, sub.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})]);
    });

    doc.autoTable({
        startY: 50,
        head: [['PRODUTO', 'QTDE', 'UNITÁRIO', 'TOTAL']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [45, 55, 72] }
    });

    let posY = doc.lastAutoTable.finalY + 15;
    doc.setFont(undefined, 'bold').text(`PAGAMENTO: ${document.getElementById('metodoPagamento').value}`, 15, posY);
    doc.text(`VALOR TOTAL: ${document.getElementById('totalDisplay').innerText}`, 140, posY);
    
    doc.save(`Orcamento_${document.getElementById('nomeCliente').value || 'Cliente'}.pdf`);
}

// Inicialização
$(document).ready(() => {
    carregarCidades();
    adicionarLinha();
    IMask(document.getElementById('frete'), maskMoneyConfig);
    IMask(document.getElementById('desconto'), maskMoneyConfig);
});