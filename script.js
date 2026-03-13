function adicionarLinha() {
    const corpo = document.getElementById('corpoTabela');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><input type="text" placeholder="Ex: Poste" onblur="calcularTotal()"></td>
        <td><input type="number" value="1" style="width: 50px" onchange="calcularTotal()"></td>
        <td><input type="text" class="money-item" placeholder="0,00" onblur="calcularTotal()"></td>
        <td><button onclick="this.parentElement.parentElement.remove(); calcularTotal();">×</button></td>
    `;
    corpo.appendChild(tr);
    // Aplica máscara no campo de valor que acabou de ser criado
    IMask(tr.querySelector('.money-item'), maskOptions.money);
}

function parseMoeda(valor) {
    return Number(valor.replace('R$', '').replace(/\./g, '').replace(',', '.')) || 0;
}

function calcularTotal() {
    let subtotal = 0;
    document.querySelectorAll('#corpoTabela tr').forEach(linha => {
        const inputs = linha.querySelectorAll('input');
        const qtd = Number(inputs[1].value);
        const valor = parseMoeda(inputs[2].value);
        subtotal += (qtd * valor);
    });

    const frete = parseMoeda(document.getElementById('frete').value);
    const desconto = parseMoeda(document.getElementById('desconto').value);
    const total = subtotal + frete - desconto;

    document.getElementById('subtotalDisplay').innerText = subtotal.toLocaleString('pt-BR', {minimumFractionDigits: 2});
    document.getElementById('totalDisplay').innerText = total.toLocaleString('pt-BR', {minimumFractionDigits: 2});
}

const maskOptions = {
    cpfCnpj: { mask: [{ mask: '000.000.000-00' }, { mask: '00.000.000/0000-00' }] },
    celular: { mask: '(00) 00000-0000' },
    cep: { mask: '00000-000' },
    money: {
        mask: 'R$ num',
        blocks: { num: { mask: Number, scale: 2, thousandsSeparator: '.', padFractionalZeros: true, radix: ',' } }
    }
};

// Aplica as máscaras nos campos que já existem na página
document.querySelectorAll('input').forEach(input => {
    if (maskOptions[input.id]) IMask(input, maskOptions[input.id]);
    if (input.classList.contains('money')) IMask(input, maskOptions.money);
});

function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Cabeçalho Fixo [cite: 8, 9, 10, 11]
    doc.setFontSize(14).setFont(undefined, 'bold');
    doc.text("MARCOS APARECIDO RODRIGUES", 105, 15, { align: "center" });
    doc.setFontSize(9).setFont(undefined, 'normal');
    doc.text("Avenida XV de Novembro, 1565 - São Carlos do Ivaí - PR - CEP: 87770-000", 105, 21, { align: "center" });
    doc.text("Bairro: Conjunto Bela Vista - Fone: (44) 99723-1252", 105, 26, { align: "center" });
    doc.line(10, 30, 200, 30);

    // Dados do Cliente [cite: 12, 13, 14, 17]
    doc.setFontSize(10).text("DADOS DO CLIENTE", 10, 37);
    doc.setFontSize(9);
    doc.text(`Cliente: ${document.getElementById('nomeCliente').value}`, 10, 43);
    doc.text(`CPF/CNPJ: ${document.getElementById('cpfCnpj').value}  |  RG/IE: ${document.getElementById('rgIe').value}`, 10, 48);
    doc.text(`Endereço: ${document.getElementById('endereco').value}, CEP: ${document.getElementById('cep').value}`, 10, 53);
    doc.text(`Cidade: ${document.getElementById('cidade').value}  |  Fone: ${document.getElementById('celular').value}`, 10, 58);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 150, 43);

    // Tabela de Itens [cite: 19]
    const itens = [];
    document.querySelectorAll('#corpoTabela tr').forEach(l => {
        const i = l.querySelectorAll('input');
        itens.push([i[0].value, i[1].value, `R$ ${Number(i[2].value).toFixed(2)}`, `R$ ${(i[1].value * i[2].value).toFixed(2)}`]);
    });

    doc.autoTable({
        startY: 65,
        head: [['PRODUTO', 'QTDE', 'VALOR UNIT.', 'TOTAL']],
        body: itens,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] }
    });

    // Financeiro e Pagamento [cite: 18, 21, 22, 23, 24]
    let finalY = doc.lastAutoTable.finalY + 10;
    const pagamentos = Array.from(document.querySelectorAll('input[name="pagamento"]:checked')).map(c => c.value).join(", ");
    
    doc.text(`Forma de Pagamento: ${pagamentos || 'Não informada'}`, 10, finalY);
    doc.text(`SUB-TOTAL: R$ ${document.getElementById('subtotal').innerText}`, 140, finalY);
    doc.text(`FRETE (+): R$ ${Number(document.getElementById('frete').value).toFixed(2)}`, 140, finalY + 5);
    doc.text(`DESCONTO (-): R$ ${Number(document.getElementById('desconto').value).toFixed(2)}`, 140, finalY + 10);
    doc.setFont(undefined, 'bold').text(`TOTAL: R$ ${document.getElementById('valorTotal').innerText}`, 140, finalY + 17);

    // Assinatura [cite: 20]
    doc.line(60, finalY + 40, 150, finalY + 40);
    doc.setFontSize(8).text("Responsável pelo recebimento", 105, finalY + 45, { align: "center" });

    doc.save(`Orcamento_${document.getElementById('nomeCliente').value}.pdf`);
}

calcularTotal();