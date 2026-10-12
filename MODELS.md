# Modelos ONNX / ONNX models

Os binários são distribuídos como assets da release **v1.0.0**, separados do histórico Git. Baixe ambos de https://github.com/4u-Labs/oneclick/releases/tag/v1.0.0 e coloque-os na pasta `models/` com os nomes abaixo.

Model binaries are release assets, excluded from Git history. Download both files and place them in `models/`, preserving these filenames. Browser effects do not require the models; the AI tools do.

| Arquivo / File | SHA-256 |
| --- | --- |
| `u2net.onnx` | `8d10d2f3bb75ae3b6d527c77944fc5e7dcd94b29809d47a739a7a728a912b491` |
| `realesr-general-x4v3.onnx` | `1940a93ee08283a0a7286183186357b1688fe9fa8ede74604b424586aaddf112` |

Os arquivos são os mesmos modelos testados na instalação do VectorAI e no OneClick AI. O U²-Net recebe imagem RGB normalizada em 320×320; o Real-ESRGAN general x4v3 amplia 4× e é usado em blocos pelo adaptador Python. Ambos foram validados em CPU via ONNX Runtime.

- U²-Net: https://github.com/xuebinqin/U-2-Net — Apache 2.0, licença incluída em `licenses/`.
- Real-ESRGAN: https://github.com/xinntao/Real-ESRGAN — BSD 3-Clause, licença incluída em `licenses/`.

Em hospedagem pública, bloqueie downloads HTTP da pasta `models/`; ela é lida apenas pelo backend. A licença e a distribuição pública dos modelos pela release são independentes do acesso às rotas do app.
