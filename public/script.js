// 页面加载时获取所有化学品数据
window.onload = async function () {
    await fetchAndDisplayChemicals();
};

// 提交表单时添加化学品
document.getElementById('addChemicalForm').onsubmit = async function (e) {
    e.preventDefault();

    // 获取表单数据
    const name = document.getElementById('name').value;
    const purity = document.getElementById('purity').value;
    const size = document.getElementById('size').value;
    const quantity = document.getElementById('quantity').value;
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;
    const recordedBy = document.getElementById('recordedBy').value;

    // 发送数据到服务器
    const response = await fetch('/addChemical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, purity, size, quantity, type, date, recordedBy })
    });

    if (response.ok) {
        alert('Chemical added successfully!');
        await fetchAndDisplayChemicals(); // 重新加载表格数据
        document.getElementById('addChemicalForm').reset(); // 清空表单
    } else {
        alert('Error adding chemical.');
    }
};

// 获取数据并填充表格
async function fetchAndDisplayChemicals() {
    const response = await fetch('/getChemicals');
    const chemicals = await response.json();

    // 清空表格内容
    document.getElementById('solidTable').innerHTML = generateTableHeader();
    document.getElementById('liquidTable').innerHTML = generateTableHeader();
    document.getElementById('fridgeTable').innerHTML = generateTableHeader();

    // 遍历数据，将化学品添加到对应的表格中
    chemicals.forEach(chemical => {
        const row = `
            <tr>
                <td>${chemical.name}</td>
                <td>${chemical.purity}</td>
                <td>${chemical.size}</td>
                <td>${chemical.quantity}</td>
                <td>${chemical.date}</td>
                <td>${chemical.recordedBy}</td>
            </tr>
        `;
        if (chemical.type === 'Solid') {
            document.getElementById('solidTable').innerHTML += row;
        } else if (chemical.type === 'Liquid') {
            document.getElementById('liquidTable').innerHTML += row;
        } else if (chemical.type === 'Fridge') {
            document.getElementById('fridgeTable').innerHTML += row;
        }
    });
}

// 生成表格的标题行
function generateTableHeader() {
    return `
        <tr>
            <th>Name</th>
            <th>Purity</th>
            <th>Size</th>
            <th>Quantity</th>
            <th>Date</th>
            <th>Recorded By</th>
        </tr>
    `;
}
