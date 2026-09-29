const architecture = [
    { 
        id: 'input', 
        label: 'Input Pupil Image', 
        color: 'bg-cyan-50 border-cyan-300 text-cyan-800',
        detailTitle: 'Optical Input (Eccentric Photorefraction)',
        detailMechanics: 'The eye is illuminated by an off-axis infrared LED, and a camera captures the light reflected off the retina.',
        detailContribution: 'This produces a specific crescent-shaped luminance gradient in the pupil. For example, in Myopia, the crescent appears opposite to the light source. The CNN uses this spatial gradient as its raw signal, rather than requiring a human to manually measure it.'
    },
    { 
        id: 'conv1', 
        label: 'Standard Conv2D / ReLU6', 
        color: 'bg-orange-50 border-orange-300 text-orange-800',
        detailTitle: 'Initial Feature Extraction',
        detailMechanics: 'A standard convolution slides 3x3 mathematical filters across the image pixels, computing dot products to detect patterns. The ReLU6 activation function sets negative values to zero and caps positive values at 6 (y = min(max(0, x), 6)).',
        detailContribution: 'These early layers learn to detect low-level visual features: edges of the pupil, the bright Purkinje reflex (the tiny dot in the center), and raw intensity gradients. They act as the "eyes" of the network.'
    },
    { 
        id: 'sep1', 
        label: 'Depthwise Separable Block', 
        desc: 'Spatial filtering without high computational cost',
        color: 'bg-yellow-50 border-yellow-300 text-yellow-800',
        detailTitle: 'Depthwise Separable Convolution',
        detailMechanics: 'Instead of applying filters across all color/feature channels at once (which requires massive computation), this block splits the work: a "Depthwise" step filters each channel independently, followed by a "Pointwise" 1x1 convolution to mix them together.',
        detailContribution: 'This is the secret to making the model run fast on smartphones and low-cost embedded devices in rural clinics. It massively reduces the number of parameters while still combining the low-level gradients into recognizable crescent shapes.'
    },
    { 
        id: 'sep2', 
        label: 'Residual Separable Block', 
        desc: 'Adding the input to the output',
        color: 'bg-green-50 border-green-300 text-green-800',
        detailTitle: 'Residual Connections',
        detailMechanics: 'The input tensor to this block is added directly to the output tensor of this block (Output = Input + F(Input)).',
        detailContribution: 'As the network gets deeper to understand complex representations (like the specific curvature and brightness drop-off of a myopic eye), gradients can vanish during training. Residual connections provide a "shortcut" for information, allowing the network to learn deeper patterns without forgetting the raw optical signal from earlier layers.'
    },
    { 
        id: 'pool', 
        label: 'Global Average Pooling (GAP)', 
        desc: 'Dimensionality collapse',
        color: 'bg-sky-50 border-sky-300 text-sky-800',
        detailTitle: 'Global Average Pooling',
        detailMechanics: 'It takes an entire 2D feature map (e.g., a 7x7 grid representing "crescent thickness") and averages all its values into a single number.',
        detailContribution: 'This flattens the spatial image data into a simple 1D vector. It makes the network robust to slight shifts—if the pupil isn\'t perfectly centered in the image, GAP ensures the network still recognizes the refractive error because it looks at the presence of the feature across the whole image, not just at exact coordinates.'
    },
    { 
        id: 'dense', 
        label: 'Dense (Fully Connected) Layer', 
        desc: 'Logit generation',
        color: 'bg-purple-50 border-purple-300 text-purple-800',
        detailTitle: 'Fully Connected Classification Head',
        detailMechanics: 'Every input node is connected to every output node via weighted edges. It maps the flattened 1D feature vector into exactly 3 raw scores (logits)—one for Myopia, one for Emmetropia, and one for Hyperopia.',
        detailContribution: 'This layer acts as the final decision-maker. It looks at the presence of all high-level features (e.g., "bright top edge detected", "dim bottom edge detected") and combines them to weigh which clinical diagnosis is most mathematically likely.'
    },
    { 
        id: 'softmax', 
        label: 'Softmax Activation', 
        desc: 'Probability normalization',
        color: 'bg-pink-50 border-pink-300 text-pink-800',
        detailTitle: 'Softmax Probability Output',
        detailMechanics: 'It applies the mathematical function P(y=k) = exp(z_k) / Σ exp(z_j) to the raw logits. This squashes the arbitrary scores into percentages that add up to 100%.',
        detailContribution: 'Transforms the network\'s raw mathematical output into a clinically readable format. Instead of saying [Myopia: 4.2, Emmetropia: -1.1, Hyperopia: 0.3], it outputs [Myopia: 96%, Emmetropia: 1%, Hyperopia: 3%]. The category with the highest probability is selected as the final screening result.'
    }
];

const container = document.getElementById('network-container');
const panel = document.getElementById('explanation-panel');
let currentImage = null;

// Build UI
architecture.forEach((layer, index) => {
    const node = document.createElement('div');
    node.id = `layer-${layer.id}`;
    node.className = `node w-3/4 max-w-sm px-4 py-3 border-2 rounded-lg shadow-sm font-medium ${layer.color} relative bg-white bg-opacity-90`;
    node.innerHTML = `
        <div class="text-base">${layer.label}</div>
        ${layer.desc ? `<div class="text-xs opacity-75 mt-1 font-normal">${layer.desc}</div>` : ''}
    `;
    
    // Make node clickable to show details manually
    node.onclick = () => showExplanation(layer);
    
    container.appendChild(node);

    if (index < architecture.length - 1) {
        const line = document.createElement('div');
        line.id = `line-${layer.id}`;
        line.className = 'flow-line';
        container.appendChild(line);
    }
});

function showExplanation(layer) {
    // Remove active class from all manually
    document.querySelectorAll('.node').forEach(n => {
        if(!isAnimating) n.classList.remove('active-node');
    });
    
    if(!isAnimating) {
        document.getElementById(`layer-${layer.id}`).classList.add('active-node');
    }

    panel.innerHTML = `
        <h3 class="text-lg font-bold text-gray-900 mb-2">${layer.detailTitle}</h3>
        <div class="mb-4">
            <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-semibold mb-1">Mathematical Mechanics</span>
            <p class="text-sm leading-relaxed">${layer.detailMechanics}</p>
        </div>
        <div>
            <span class="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-semibold mb-1">Clinical Contribution</span>
            <p class="text-sm leading-relaxed">${layer.detailContribution}</p>
        </div>
    `;
}

let isAnimating = false;

async function runNetwork(targetClass) {
    if (isAnimating) return;
    isAnimating = true;
    currentImage = targetClass;

    document.getElementById('final-result').classList.remove('hidden');

    // Reset UI
    ['myopia', 'emmetropia', 'hyperopia'].forEach(c => {
        const el = document.getElementById(`out-${c}`);
        el.className = 'flex-1 text-center py-3 rounded-lg border-2 border-gray-200 bg-gray-50 opacity-50 font-bold';
    });
    document.querySelectorAll('.node').forEach(n => n.classList.remove('active-node'));

    // Animate through layers
    for (let i = 0; i < architecture.length; i++) {
        const layer = architecture[i];
        const nodeEl = document.getElementById(`layer-${layer.id}`);
        
        nodeEl.classList.add('active-node');
        showExplanation(layer); // Update text panel automatically during flow
        
        await new Promise(r => setTimeout(r, 1200)); // slow down so user can read

        nodeEl.classList.remove('active-node');

        if (i < architecture.length - 1) {
            const lineEl = document.getElementById(`line-${layer.id}`);
            lineEl.classList.add('active-line');
            await new Promise(r => setTimeout(r, 300));
            lineEl.classList.remove('active-line');
        }
    }

    // Show final prediction
    const finalEl = document.getElementById(`out-${targetClass}`);
    finalEl.className = '';
    
    if (targetClass === 'myopia') finalEl.className = 'flex-1 text-center py-3 rounded-lg border-2 border-red-500 bg-red-100 text-red-800 font-bold transform scale-105 shadow-md transition-all';
    if (targetClass === 'emmetropia') finalEl.className = 'flex-1 text-center py-3 rounded-lg border-2 border-green-500 bg-green-100 text-green-800 font-bold transform scale-105 shadow-md transition-all';
    if (targetClass === 'hyperopia') finalEl.className = 'flex-1 text-center py-3 rounded-lg border-2 border-blue-500 bg-blue-100 text-blue-800 font-bold transform scale-105 shadow-md transition-all';
    
    panel.innerHTML += `
        <div class="mt-6 p-4 bg-gray-100 rounded border border-gray-300">
            <strong>Conclusion:</strong> The optical signal of <em>${targetClass.toUpperCase()}</em> was successfully broken down, spatially mapped, and correctly classified without requiring a clinical autorefractor.
        </div>
    `;

    isAnimating = false;
}
