function adicionarLinha() {
    const corpo = document.getElementById('corpoTabela');
    const novaLinha = `<tr>
        <td><input type="text" placeholder="Produto"></td>
        <td><input type="number" value="1" oninput="calcularTotal()"></td>
        <td><input type="number" value="0.00" oninput="calcularTotal()"></td>
        <td><button onclick="removerLinha(this)">-</button></td>
    </tr>`;
    corpo.insertAdjacentHTML('beforeend', novaLinha);
    calcularTotal();
}

function removerLinha(btn) {
    btn.parentElement.parentElement.remove();
    calcularTotal();
}

function calcularTotal() {
    let total = 0;
    const linhas = document.querySelectorAll('#corpoTabela tr');
    linhas.forEach(linha => {
        const qtd = linha.querySelectorAll('input')[1].value;
        const valor = linha.querySelectorAll('input')[2].value;
        total += (qtd * valor);
    });
    document.getElementById('valorTotal').innerText = total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    return total;
}

async function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Cabeçalho baseado no documento original [cite: 1, 2, 4]
    doc.setFontSize(14);
    doc.text("MARCOS APARECIDO RODRIGUES", 14, 15);
    doc.setFontSize(10);
    doc.text("Avenida XV de Novembro, 1565 - São Carlos do Ivaí - PR", 14, 22);
    doc.text("Fone: (44) 99723-1252", 14, 28);
    
    doc.line(14, 32, 196, 32); // Linha divisória

    // Dados do Cliente [cite: 5, 10]
    doc.setFontSize(11);
    doc.text(`Cliente: ${document.getElementById('nomeCliente').value}`, 14, 42);
    doc.text(`Endereço: ${document.getElementById('enderecoCliente').value}`, 14, 48);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 14, 54);

    // Tabela de Itens [cite: 12]
    const itens = [];
    document.querySelectorAll('#corpoTabela tr').forEach(linha => {
        const inputs = linha.querySelectorAll('input');
        const subtotal = inputs[1].value * inputs[2].value;
        itens.push([
            inputs[0].value,
            inputs[1].value,
            `R$ ${parseFloat(inputs[2].value).toFixed(2)}`,
            `R$ ${subtotal.toFixed(2)}`
        ]);
    });

    doc.autoTable({
        startY: 62,
        head: [['PRODUTO', 'QTDE', 'VALOR UNIT.', 'TOTAL']],
        body: itens,
        theme: 'grid',
        headStyles: { fillColor: [60, 60, 60] }
    });

    // Rodapé [cite: 14, 17]
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`SUB-TOTAL: R$ ${document.getElementById('valorTotal').innerText}`, 140, finalY);
    doc.setFont("helvetica", "bold");
    doc.text(`TOTAL: R$ ${document.getElementById('valorTotal').innerText}`, 140, finalY + 7);

    doc.save(`Orcamento_${document.getElementById('nomeCliente').value}.pdf`);
}

// Inicializa o total
calcularTotal();