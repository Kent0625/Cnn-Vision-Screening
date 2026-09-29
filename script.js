const architecture = [
    { id: 'input', label: 'Input Pupil Image', color: 'bg-cyan-100 border-cyan-400 text-cyan-800' },
    { id: 'conv1', label: 'Conv2D / ReLU6', color: 'bg-orange-100 border-orange-400 text-orange-800' },
    { id: 'conv2', label: 'Conv2D / ReLU6', color: 'bg-orange-100 border-orange-400 text-orange-800' },
    { id: 'sep1', label: '4x Depthwise Separable Block', color: 'bg-yellow-100 border-yellow-400 text-yellow-800', desc: 'Sep-Conv2D / MaxPool2D' },
    { id: 'sep2', label: '2x Residual Separable Block', color: 'bg-green-100 border-green-400 text-green-800', desc: 'Sep-Conv2D / Residual Add' },
    { id: 'conv3', label: 'Conv2D', color: 'bg-lime-100 border-lime-400 text-lime-800' },
    { id: 'pool', label: 'Global AvgPool2D', color: 'bg-sky-100 border-sky-400 text-sky-800' },
    { id: 'dense', label: 'Dense (Fully Connected)', color: 'bg-purple-100 border-purple-400 text-purple-800' },
    { id: 'softmax', label: 'Softmax', color: 'bg-pink-100 border-pink-400 text-pink-800' }
];

const container = document.getElementById('network-container');

// Build UI
architecture.forEach((layer, index) => {
    // Add Node
    const node = document.createElement('div');
    node.id = `layer-${layer.id}`;
    node.className = `node w-64 text-center px-4 py-2 border-2 rounded shadow-sm font-medium ${layer.color} z-10 bg-opacity-90`;
    node.innerHTML = `
        <div>${layer.label}</div>
        ${layer.desc ? `<div class="text-xs opacity-75 mt-1 font-normal">${layer.desc}</div>` : ''}
    `;
    container.appendChild(node);

    // Add connecting line (except after last node)
    if (index < architecture.length - 1) {
        const line = document.createElement('div');
        line.id = `line-${layer.id}`;
        line.className = 'flow-line';
        container.appendChild(line);
    }
});

let isAnimating = false;

async function runNetwork(targetClass) {
    if (isAnimating) return;
    isAnimating = true;

    const statusEl = document.getElementById('status-text');
    statusEl.textContent = 'Processing image...';
    
    // Reset outputs
    ['myopia', 'emmetropia', 'hyperopia'].forEach(c => {
        const el = document.getElementById(`out-${c}`);
        el.classList.remove('active-node', 'opacity-100');
        el.classList.add('opacity-50');
    });

    // Animate through layers
    for (let i = 0; i < architecture.length; i++) {
        const layer = architecture[i];
        const nodeEl = document.getElementById(`layer-${layer.id}`);
        
        // Highlight current node
        nodeEl.classList.add('active-node');
        
        await new Promise(r => setTimeout(r, 400)); // wait 400ms

        nodeEl.classList.remove('active-node');

        // Highlight line to next node
        if (i < architecture.length - 1) {
            const lineEl = document.getElementById(`line-${layer.id}`);
            lineEl.classList.add('active-line');
            await new Promise(r => setTimeout(r, 200)); // wait 200ms
            lineEl.classList.remove('active-line');
        }
    }

    // Highlight final prediction
    statusEl.textContent = `Classification complete: ${targetClass.toUpperCase()}`;
    const finalEl = document.getElementById(`out-${targetClass}`);
    finalEl.classList.remove('opacity-50');
    finalEl.classList.add('active-node', 'opacity-100');
    
    setTimeout(() => {
        finalEl.classList.remove('active-node');
        isAnimating = false;
    }, 1000);
}
