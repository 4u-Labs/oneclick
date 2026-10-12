# Avaliação preliminar de modelos locais — 12/10/2026

Esta etapa entrega pincéis, clonagem, interpolação de pequenas manchas e efeitos por região no navegador. Não há novas dependências nem serviços externos. LaMa e GFPGAN não foram instalados nem submetidos a inferência; esta avaliação cobre finalidade, ambiente e critérios para o próximo experimento.

## Ambiente conferido

- Python local com PyTorch 2.14.0+cpu, OpenCV e ONNX Runtime disponíveis.
- CUDA indisponível. ONNX Runtime anuncia CPUExecutionProvider e AzureExecutionProvider; o app mantém suas inferências em CPU, sem usar Azure.
- Modelos existentes: U²-Net e Real-ESRGAN general x4v3. Inferência de ambos já foi validada na etapa 1.
- Aceleração e tempos do VPS não foram medidos. A inspeção foi do computador local.

## Candidatos

| Recurso | Candidato | Avaliação atual |
| --- | --- | --- |
| Remover objetos em cenas complexas | LaMa | Primeiro candidato para testar com a máscara pintada. Precisa de checkpoint e ambiente isolado; não está disponível no app. |
| Restaurar fotografias com rostos degradados | GFPGAN | Candidato específico para rostos. Não é restauração geral de logos, textos ou documentos. Precisa de avaliação visual para evitar alterar a identidade. |
| Ampliação e melhoria geral | Real-ESRGAN já instalado | Continuar usando a função Melhorar. Não substitui preenchimento de áreas ausentes. |

O [LaMa oficial](https://github.com/advimman/lama) recebe imagem e máscara para preenchimento; o repositório usa [Apache 2.0](https://github.com/advimman/lama/blob/main/LICENSE). O [GFPGAN oficial](https://github.com/TencentARC/GFPGAN) se concentra em restauração facial; sua [licença](https://github.com/TencentARC/GFPGAN/blob/master/LICENSE) identifica componentes de terceiros além da licença principal. Antes de distribuir, verificar também a origem e os termos do checkpoint escolhido.

## Experimento seguinte

Testar LaMa em ambiente separado, inicialmente com imagens de 512 × 512, máscara fornecida pelo usuário e uma inferência por vez. Medir tempo e pico de RAM na CPU, depois no VPS. Comparar pelo menos fundos lisos, texturas repetidas, bordas de objetos e áreas com texto, incluindo a preservação dos pixels fora da máscara. Só integrar após confirmar qualidade, limites de tamanho, cancelamento, fila e licenças do artefato efetivamente usado.

Não há resultados de benchmark nem promessa de desempenho para LaMa ou GFPGAN nesta entrega. Os retoques atuais continuam funcionais mesmo sem esses modelos.
