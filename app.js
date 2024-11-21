const {
    mysql,
    qInsImplantacao,
    qInsDependentes,
    config,
    qInsEntidade,
} = require("./database");
const cors = require("cors");

const express = require("express");
const app = new express();
const ejs = require("ejs");
const { format } = require("date-fns");
const { ptBR } = require("date-fns/locale");
const fs = require("fs");
const fsPromises = require("fs").promises;
const cookie = require("cookie-parser");
const { default: parseJSON } = require("date-fns/parseJSON");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");
const winston = require("winston");
const nodemailer = require("nodemailer");
const multer = require("multer");

const port = process.env.PORT || 9898;
const appUrl = process.env.APP_URL || "http://localhost:5586";

app.use(bodyParser.urlencoded({ extended: true }));
app.use("/css", express.static("css"));
app.use("/js", express.static("js"));
app.use("/img", express.static("img"));
app.use("/fonts", express.static("fonts"));
app.use("/bootstrap-icons", express.static("node_modules/bootstrap-icons"));
app.set("view engine", "ejs");
app.use(cookie());
app.use(express.json());

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const corsOptions = {
    origin: "https://selectoperadora.com.br",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Diretório onde os arquivos serão armazenados temporariamente
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome único para cada arquivo
    },
});
const upload = multer({ storage });

app.use(cors(corsOptions));

const transporter = nodemailer.createTransport({
    service: "gmail", // ou outro serviço SMTP que você preferir
    auth: {
        user: "operadoraselectsaude@gmail.com", // Seu email
        pass: "afsi vlwt cknq afig", // Senha de aplicativo gerada no Gmail (ou senha normal se não for Gmail)
    },
});

const generateSecretKey = () => {
    return crypto.randomBytes(32).toString("hex");
};

/* const secretKey = generateSecretKey();

app.use(
    session({
    secret: secretKey,
    resave: false,
    saveUninitialized: false,
    })
); */

const discordWebhookUrl = 'https://discord.com/api/webhooks/1296523170911879249/iiaZa4nUaKbcVLTsWW_eVfHqdrmov_1Insyo-jVAqw8A7e4adDpwfjun9mHkMt5XTS9W';

class DiscordTransport extends winston.transports.Console {
    log(info, callback) {
        setImmediate(() => this.emit('logged', info));

        if (info.level === 'error') {
            // Montar mensagem para o Discord
            const discordMessage = {
                username: 'Error MKT Select', // Nome do bot no Discord
                content: `🚨 **ERRO DETECTADO**\n**Timestamp**: ${info.timestamp}\n**Mensagem**: ${info.message}\n${info.stack ? `**Stacktrace**: \`\`\`${info.stack}\`\`\`` : ''}`
            };

            // Enviar mensagem para o Discord
            axios.post(discordWebhookUrl, discordMessage).catch(error => {
                console.error('Erro ao enviar notificação para o Discord:', error);
            });
        }

        callback();
    }
}

const logger = winston.createLogger({
    level: "error",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }), // Para incluir stacktrace no log
        winston.format.json()
    ),
    transports: [
        // Registrar o erro em um arquivo de log
        new winston.transports.File({
            filename: path.join("erros", "error.log.json"),
        }),
        // Transporte personalizado para enviar notificações de erro ao Discord
        new DiscordTransport()
    ],
});


app.get('/test-error', (req, res) => {
    throw new Error('Este é um erro de teste para verificar o envio ao Discord.');
});

async function enviarDadosParaGoogleSheet(dados) {
    const scriptURL =
        "https://script.google.com/macros/s/AKfycbzovRQQXLa4hp95Olo-sept4a2IYknR272wai5YGnDCkS2gv1CUnXB6aITjk5VPVZGD/exec";

    try {
        await axios.post(scriptURL, dados);
        console.log("Dados enviados para o Google Sheets com sucesso.");
    } catch (error) {
        console.error("Erro ao enviar dados para o Google Sheets:", error);
    }
}

async function enviarDadosParaGoogleSheetSelectSalvador(dados) {
    const scriptURL =
        "https://script.google.com/macros/s/AKfycbywd-3xKJOAALihNMJfUpNFgikVQS9nkzbhUx4hJoYUEWmv3OdTjuFCX5gPrZB9T3Qwuw/exec";

    try {
        await axios.post(scriptURL, dados);
        console.log("Dados enviados para o Google Sheets com sucesso.");
    } catch (error) {
        console.error("Erro ao enviar dados para o Google Sheets:", error);
    }
}

async function enviarDadosParaGoogleSheetSelectBrasilia(dados) {
    const scriptURL =
        "https://script.google.com/macros/s/AKfycbxlGw-jeb-rVjFfY-n0YDpbCa3wC_5OQsq6I8G2mFgKAq6yqf9_efjaMjU-MPI1f7Pa/exec";

    try {
        await axios.post(scriptURL, dados);
        console.log("Dados enviados para o Google Sheets com sucesso.");
    } catch (error) {
        console.error("Erro ao enviar dados para o Google Sheets:", error);
    }
}

async function enviarDadosParaGoogleSheetSelectBH(dados) {
    const scriptURL =
        "https://script.google.com/macros/s/AKfycbzRuzz7T-LQACagVKC8xISNl0LNFndvIBGAwJBHhg47cMvkHVIenCnHhiMsf7KoQ3ib/exec";

    try {
        await axios.post(scriptURL, dados);
        console.log("Dados enviados para o Google Sheets com sucesso.");
    } catch (error) {
        console.error("Erro ao enviar dados para o Google Sheets:", error);
    }
}

const emailsPorUf = {
    /* AC: ["p.petelak@gmail.com"], */
    AC: ['credenciamento13@redeselect.com.br'],
    AL: ["credenciamento16@redeselect.com.br"],
    AM: ["credenciamento13@redeselect.com.br"],
    AP: ["credenciamento13@redeselect.com.br"],
    BA: ["credenciamento16@redeselect.com.br"],
    CE: ["credenciamento16@redeselect.com.br"],
    DF: ["credenciamento10@redeselect.com.br"],
    ES: [
        "credenciamento15@redeselect.com.br",
        "credenciamento12@redeselect.com.br",
        "credenciamento17@redeselect.com.br",
        "credenciamento21@redeselect.com.br",
        "credenciamento19@redeselect.com.br",
        "credenciamento20@redeselect.com.br",
    ],
    GO: ["credenciamento10@redeselect.com.br"],
    MA: ["credenciamento16@redeselect.com.br"],
    MG: [
        "credenciamento15@redeselect.com.br",
        "credenciamento12@redeselect.com.br",
        "credenciamento17@redeselect.com.br",
        "credenciamento21@redeselect.com.br",
        "credenciamento19@redeselect.com.br",
        "credenciamento20@redeselect.com.br",
    ],
    MS: ["credenciamento10@redeselect.com.br"],
    MT: ["credenciamento10@redeselect.com.br"],
    PA: ["credenciamento13@redeselect.com.br"],
    PB: ["credenciamento16@redeselect.com.br"],
    PE: ["credenciamento16@redeselect.com.br"],
    PI: ["credenciamento16@redeselect.com.br"],
    PR: ["credenciamento14@redeselect.com.br"],
    RJ: [
        "credenciamento15@redeselect.com.br",
        "credenciamento12@redeselect.com.br",
        "credenciamento17@redeselect.com.br",
        "credenciamento21@redeselect.com.br",
        "credenciamento19@redeselect.com.br",
        "credenciamento20@redeselect.com.br",
    ],
    RN: ["credenciamento16@redeselect.com.br"],
    RO: ["credenciamento13@redeselect.com.br"],
    RR: ["credenciamento13@redeselect.com.br"],
    RS: ["credenciamento14@redeselect.com.br"],
    SC: ["credenciamento14@redeselect.com.br"],
    SE: ["credenciamento16@redeselect.com.br"],
    SP: [
        "credenciamento15@redeselect.com.br",
        "credenciamento12@redeselect.com.br",
        "credenciamento17@redeselect.com.br",
        "credenciamento21@redeselect.com.br",
        "credenciamento19@redeselect.com.br",
        "credenciamento20@redeselect.com.br",
    ],
    TO: ["credenciamento13@redeselect.com.br"],
};

app.get('/enviar-credenciado', (req, res) => {
    res.render('formulario-credenciados');
})

// Rota para enviar o e-mail com suporte a anexos
app.post('/send-email', upload.fields([{ name: 'anexo', maxCount: 10 }]), asyncHandler(async (req, res) => {
    const {
        cpf_cnpj,
        nome,
        telefone,
        celular,
        whatsapp,
        email,
        endereco,
        numero,
        bairro,
        cidade,
        uf,
        tipo_prestador,
        especialidades,
        apresentacao,
    } = req.body;

    // Verificar se o estado (UF) está mapeado para algum e-mail
    const emailsDestino = emailsPorUf[uf];
    if (!emailsDestino || emailsDestino.length === 0) {
        return res.status(400).json({ success: false, message: 'Estado (UF) não mapeado.' });
    }

    // Preparar anexos, se houver
    const attachments = [];
    if (req.files && req.files.anexo) {
        req.files.anexo.forEach(file => {
            attachments.push({
                filename: file.originalname,
                path: file.path,
            });
        });
    }

    // Configurações do e-mail
    const mailOptions = {
        from: 'operadoraselectsaude@gmail.com', // Seu email
        to: emailsDestino, // Enviar para o(s) e-mail(s) associado(s) ao UF
        subject: `[Seja um Credenciado]: ${uf} - ${nome}`,
        text: `CNPJ / CPF: ${cpf_cnpj}
      Nome: ${nome}
      Telefone: ${telefone}
      Celular: ${celular}
      Whatsapp: ${whatsapp}
      E-mail: ${email}
      Endereço: ${endereco}, ${numero}, ${bairro}, ${cidade} - ${uf}
        Tipo de Prestador: ${tipo_prestador}
        Especialidades / Serviços: ${especialidades}
        Comentário: ${apresentacao}`,
        attachments, // Anexos (se houver)
    };

    try {
        // Enviar o e-mail
        await transporter.sendMail(mailOptions);

        // Remover arquivos temporários após o envio
        if (req.files && req.files.anexo) {
            req.files.anexo.forEach(file => {
                fs.unlinkSync(file.path);
            });
        }

        res.status(200).json({ success: true, message: 'E-mail enviado com sucesso!' });
    } catch (error) {
        throw error; // Garantir que o erro será tratado pelo middleware de erro
    }
}));


app.get("/confirmar", (req, res) => {
    let tipoConvite = req.query.tipoConvite;
    if (tipoConvite === "pista") {
        res.render("convite-pista");
    } else if (tipoConvite === "camarote") {
        res.render("convite-camarote");
    } else {
        res.send("Tipo de convite inválido");
    }
});

app.get("/confirmarCorretoras", (req, res) => {
    res.render("corretora-convite-pista");
});

app.post("/submit-form", async (req, res) => {
    console.log("Entrando na rota");
    const pool = await mysql.createPool(config);

    try {
        const {
            cpf,
            nomeCompleto,
            email,
            telefone,
            empresa,
            vaiLevarConvidado,
            cpfConvidado,
            nomeCompletoConvidado,
            emailConvidado,
            telefoneConvidado,
            profissaoConvidado,
            empresaConvidado,
            tipoConvite,
            convitesVIP,
            convitesPista,
        } = req.body;

        console.log("Dados recebidos:", req.body);

        // Verificar se o CPF já está cadastrado
        const cpfCheck = await pool.query(
            "SELECT * FROM convidados WHERE cpf = ?",
            [cpf]
        );
        if (cpfCheck.length > 0) {
            return res.status(400).json({ message: "CPF já cadastrado." });
        }

        // Verificar o limite de convites VIP e de pista para a empresa
        const empresaData = await pool.query(
            "SELECT * FROM empresas WHERE id = ?",
            [empresa]
        );
        if (!empresaData.length) {
            return res.status(400).json({ message: "Empresa não encontrada." });
        }

        const empresaRecord = empresaData[0];

        if (tipoConvite === "camarote") {
            const vipCount = await pool.query(
                `SELECT COUNT(*) AS count FROM convidados WHERE empresa = ? AND convite = 'camarote'`,
                [empresa]
            );
            if (vipCount[0].count >= empresaRecord.convites_vip) {
                return res
                    .status(400)
                    .json({ message: "Limite de convites atingido." });
            }
        } else if (tipoConvite === "pista") {
            console.log("entrou aqui");
            const pistaCount = await pool.query(
                `SELECT COUNT(*) AS count FROM convidados WHERE empresa = ? AND convite = 'pista'`,
                [empresa]
            );
            if (pistaCount[0].count >= empresaRecord.convites_pista) {
                return res
                    .status(400)
                    .json({ message: "Limite de convites atingido sentimos muito." });
            }
        }

        // Gerar número de convite único para o anfitrião
        let numeroConvite;
        let conviteCheck;
        do {
            numeroConvite = `V${Math.floor(Math.random() * 90000) + 10000}`;
            conviteCheck = await pool.query(
                "SELECT * FROM convidados WHERE numero_convite = ?",
                [numeroConvite]
            );
        } while (conviteCheck.length > 0);

        // Inserir anfitrião no banco de dados
        await pool.query(
            `INSERT INTO convidados (nome_completo, cpf, tipodeconvidado, numero_convite, convite, email, empresa, telefone, data_inserido)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                nomeCompleto,
                cpf,
                "anfitrião",
                numeroConvite,
                tipoConvite,
                email,
                empresa,
                telefone,
            ]
        );

        let numeroConviteConvidado;
        let conviteConvidadoCheck;

        // Inserir convidado extra se necessário
        if (vaiLevarConvidado === "sim") {
            const cpfConvidadoCheck = await pool.query(
                "SELECT * FROM convidados WHERE cpf = ?",
                [cpfConvidado]
            );
            if (cpfConvidadoCheck.length > 0) {
                return res
                    .status(400)
                    .json({ message: "CPF do convidado já cadastrado." });
            }

            if (empresaConvidado) {
                const [empresaConvidadoData] = await pool.query(
                    "SELECT * FROM empresas WHERE id = ?",
                    [empresaConvidado]
                );
                if (!empresaConvidadoData.length) {
                    return res
                        .status(400)
                        .json({ message: "Empresa do convidado não encontrada." });
                }

                const convidadoRecord = empresaConvidadoData[0];

                if (tipoConvite === "camarote") {
                    const [vipCountConvidado] = await pool.query(
                        'SELECT COUNT(*) AS count FROM convidados WHERE empresa = ? AND convite = "camarote"',
                        [empresaConvidado]
                    );
                    if (vipCountConvidado[0].count >= convidadoRecord.convites_vip) {
                        return res
                            .status(400)
                            .json({ message: "Limite de convites atingido." });
                    }
                } else if (tipoConvite === "pista") {
                    const [pistaCountConvidado] = await pool.query(
                        'SELECT COUNT(*) AS count FROM convidados WHERE empresa = ? AND convite = "pista"',
                        [empresaConvidado]
                    );
                    if (pistaCountConvidado[0].count >= convidadoRecord.convites_pista) {
                        return res
                            .status(400)
                            .json({ message: "Limite de convites atingido." });
                    }
                }
            }

            do {
                numeroConviteConvidado = `V${Math.floor(Math.random() * 90000) + 10000
                    }`;
                conviteConvidadoCheck = await pool.query(
                    "SELECT * FROM convidados WHERE numero_convite = ?",
                    [numeroConviteConvidado]
                );
            } while (conviteConvidadoCheck.length > 0);

            await pool.query(
                `INSERT INTO convidados (nome_completo, cpf, tipodeconvidado, numero_convite, convite, email, telefone, data_inserido)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    nomeCompletoConvidado,
                    cpfConvidado,
                    "convidado",
                    numeroConviteConvidado,
                    tipoConvite,
                    emailConvidado,
                    telefoneConvidado,
                ]
            );
        }

        let nomeEmpresaConsult = await pool.query(
            "SELECT nome FROM empresas WHERE id = ?",
            [empresa]
        );

        const dadosAnfitriao = {
            cpf: cpf,
            nomeCompleto: nomeCompleto,
            email: email,
            telefone: telefone,
            tipoConvite: tipoConvite,
            empresa: nomeEmpresaConsult[0].nome,
        };

        if (vaiLevarConvidado === "sim") {
            const dadosConvidado = {
                cpf: cpfConvidado,
                nomeCompleto: nomeCompletoConvidado,
                email: emailConvidado,
                telefone: telefoneConvidado,
                tipoConvite: tipoConvite,
                empresa: nomeEmpresaConsult[0].nome,
            };

            // Envia dados do anfitrião e do convidado
            await enviarDadosParaGoogleSheet({
                anfitriao: dadosAnfitriao,
                convidado: dadosConvidado,
            });
        } else {
            // Envia apenas dados do anfitrião
            await enviarDadosParaGoogleSheet({ anfitriao: dadosAnfitriao });
        }

        res.status(200).json({
            numeroConviteAnfitriao: numeroConvite,
            numeroConviteConvidado: numeroConviteConvidado || null,
            tipoConvite: tipoConvite,
            cpf: cpf,
            nomeCompleto: nomeCompleto,
            cpfConvidado: cpfConvidado,
            nomeCompletoConvidado: nomeCompletoConvidado,
        });
    } catch (err) {
        console.error("Erro:", err);
        res.status(500).json({ message: "Erro ao inserir dados" });
    } finally {
        pool.end();
    }
});

app.post("/submit-form-select-salvador", async (req, res) => {
    console.log("Entrando na rota");
    const pool = await mysql.createPool(config);

    try {
        const { cpf, nomeCompleto, email, telefone, empresa } = req.body;

        console.log("Dados recebidos:", req.body);

        const countConvidados = await pool.query(
            "SELECT COUNT(*) AS total FROM convidadosSelectSalvador"
        );
        if (countConvidados[0].total >= 1400) {
            return res
                .status(400)
                .json({ message: "O número limite de convidados foi atingido." });
        }

        // Verificar se o CPF já está cadastrado
        const cpfCheck = await pool.query(
            "SELECT * FROM convidadosSelectSalvador WHERE cpf = ?",
            [cpf]
        );
        if (cpfCheck.length > 0) {
            return res.status(400).json({ message: "CPF já cadastrado." });
        }

        // Gerar número de convite único para o anfitrião
        let numeroConvite;
        let conviteCheck;
        do {
            numeroConvite = `V${Math.floor(Math.random() * 90000) + 10000}`;
            conviteCheck = await pool.query(
                "SELECT * FROM convidadosSelectSalvador WHERE numero_convite = ?",
                [numeroConvite]
            );
        } while (conviteCheck.length > 0);

        // Inserir anfitrião no banco de dados
        await pool.query(
            `INSERT INTO convidadosSelectSalvador (nome_completo, cpf, numero_convite, email, empresa, telefone, data_inserido)
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [nomeCompleto, cpf, numeroConvite, email, empresa, telefone]
        );

        const dadosAnfitriao = {
            cpf: cpf,
            nomeCompleto: nomeCompleto,
            email: email,
            telefone: telefone,
            tipoConvite: "Pista",
            empresa: empresa,
        };

        await enviarDadosParaGoogleSheetSelectSalvador({
            anfitriao: dadosAnfitriao,
        });

        res.status(200).json({
            numeroConviteAnfitriao: numeroConvite,
            tipoConvite: "Pista",
            cpf: cpf,
            nomeCompleto: nomeCompleto,
        });
    } catch (err) {
        logger.info("Erro:", err);
        console.error("Erro:", err);
        res.status(500).json({ message: "Erro ao inserir dados" });
    } finally {
        pool.end();
    }
});

app.post("/submit-form-select-brasilia", async (req, res) => {
    console.log("Entrando na rota");
    const pool = await mysql.createPool(config);

    try {
        const { cpf, nomeCompleto, email, telefone, empresa } = req.body;

        console.log("Dados recebidos:", req.body);

        const countConvidados = await pool.query(
            "SELECT COUNT(*) AS total FROM convidadosSelectBrasilia"
        );
        if (countConvidados[0].total >= 600) {
            return res
                .status(400)
                .json({ message: "O número limite de convidados foi atingido." });
        }

        // Verificar se o CPF já está cadastrado
        const cpfCheck = await pool.query(
            "SELECT * FROM convidadosSelectBrasilia WHERE cpf = ?",
            [cpf]
        );
        if (cpfCheck.length > 0) {
            return res.status(400).json({ message: "CPF já cadastrado." });
        }

        // Gerar número de convite único para o anfitrião
        let numeroConvite;
        let conviteCheck;
        do {
            numeroConvite = `V${Math.floor(Math.random() * 90000) + 10000}`;
            conviteCheck = await pool.query(
                "SELECT * FROM convidadosSelectBrasilia WHERE numero_convite = ?",
                [numeroConvite]
            );
        } while (conviteCheck.length > 0);

        // Inserir anfitrião no banco de dados
        await pool.query(
            `INSERT INTO convidadosSelectBrasilia (nome_completo, cpf, numero_convite, email, empresa, telefone, data_inserido)
            VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [nomeCompleto, cpf, numeroConvite, email, empresa, telefone]
        );

        const dadosAnfitriao = {
            cpf: cpf,
            nomeCompleto: nomeCompleto,
            email: email,
            telefone: telefone,
            tipoConvite: "Pista",
            empresa: empresa,
        };

        await enviarDadosParaGoogleSheetSelectBrasilia({
            anfitriao: dadosAnfitriao,
        });

        res.status(200).json({
            numeroConviteAnfitriao: numeroConvite,
            tipoConvite: "Pista",
            cpf: cpf,
            nomeCompleto: nomeCompleto,
        });
    } catch (err) {
        logger.info("Erro:", err);
        console.error("Erro:", err);
        res.status(500).json({ message: "Erro ao inserir dados" });
    } finally {
        pool.end();
    }
});

app.post("/submit-form-select-BH", async (req, res) => {
    console.log("Entrando na rota");
    const pool = await mysql.createPool(config);

    try {
        const { cpf, nomeCompleto, email, telefone, empresa, nomeSupervisor } = req.body;

        console.log("Dados recebidos:", req.body);

        const countConvidados = await pool.query(
            "SELECT COUNT(*) AS total FROM convidadosSelectBH"
        );
        if (countConvidados[0].total >= 600) {
            return res
                .status(400)
                .json({ message: "O número limite de convidados foi atingido." });
        }

        // Verificar se o CPF já está cadastrado
        const cpfCheck = await pool.query(
            "SELECT * FROM convidadosSelectBH WHERE cpf = ?",
            [cpf]
        );
        if (cpfCheck.length > 0) {
            return res.status(400).json({ message: "CPF já cadastrado." });
        }

        // Gerar número de convite único para o anfitrião
        let numeroConvite;
        let conviteCheck;
        do {
            numeroConvite = `V${Math.floor(Math.random() * 90000) + 10000}`;
            conviteCheck = await pool.query(
                "SELECT * FROM convidadosSelectBH WHERE numero_convite = ?",
                [numeroConvite]
            );
        } while (conviteCheck.length > 0);

        // Inserir anfitrião no banco de dados
        await pool.query(
            `INSERT INTO convidadosSelectBH (nome_completo, cpf, numero_convite, email, empresa, telefone, nome_supervisor, data_inserido)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
            [nomeCompleto, cpf, numeroConvite, email, empresa, telefone, nomeSupervisor]
        );

        const dadosAnfitriao = {
            cpf: cpf,
            nomeCompleto: nomeCompleto,
            email: email,
            telefone: telefone,
            tipoConvite: "Pista",
            empresa: empresa,
            nomeSupervisor: nomeSupervisor
        };

        await enviarDadosParaGoogleSheetSelectBH({
            anfitriao: dadosAnfitriao,
        });

        res.status(200).json({
            numeroConviteAnfitriao: numeroConvite,
            tipoConvite: "Pista",
            cpf: cpf,
            nomeCompleto: nomeCompleto,
        });
    } catch (err) {
        logger.info("Erro:", err);
        console.error("Erro:", err);
        res.status(500).json({ message: "Erro ao inserir dados" });
    } finally {
        pool.end();
    }
});

app.post("/submit-form-corretoras", async (req, res) => {
    const pool = await mysql.createPool(config);
    let nomeEmpresaCorretora = req.query.parametro;
    let empresaCorretoraConsult = await pool.query(
        "SELECT id FROM empresas WHERE nome = ?",
        [nomeEmpresaCorretora]
    );
    let empresaCorretora = empresaCorretoraConsult[0].id;
    console.log({
        id: empresaCorretora,
        nome: nomeEmpresaCorretora,
    });

    try {
        const {
            cpf,
            nomeCompleto,
            email,
            telefone,
            vaiLevarConvidado,
            cpfConvidado,
            nomeCompletoConvidado,
            emailConvidado,
            telefoneConvidado,
            profissaoConvidado,
            empresaConvidado,
            tipoConvite,
            convitesVIP,
            convitesPista,
        } = req.body;

        console.log("Dados recebidos:", req.body);

        // Verificar se o CPF já está cadastrado
        const cpfCheck = await pool.query(
            "SELECT * FROM convidados WHERE cpf = ?",
            [cpf]
        );
        if (cpfCheck.length > 0) {
            return res.status(400).json({ message: "CPF já cadastrado." });
        }

        // Verificar o limite de convites VIP e de pista para a empresa
        const empresaData = await pool.query(
            "SELECT * FROM empresas WHERE id = ?",
            [empresaCorretora]
        );
        if (!empresaData.length) {
            return res.status(400).json({ message: "Empresa não encontrada." });
        }

        const empresaRecord = empresaData[0];

        if (tipoConvite === "camarote") {
            const vipCount = await pool.query(
                `SELECT COUNT(*) AS count FROM convidados WHERE empresa = ? AND convite = 'camarote'`,
                [empresaCorretora]
            );
            if (vipCount[0].count >= empresaRecord.convites_vip) {
                return res
                    .status(400)
                    .json({ message: "Limite de convites atingido." });
            }
        } else if (tipoConvite === "pista") {
            console.log("entrou aqui");
            const pistaCount = await pool.query(
                `SELECT COUNT(*) AS count FROM convidados WHERE empresa = ? AND convite = 'pista'`,
                [empresaCorretora]
            );
            if (pistaCount[0].count >= empresaRecord.convites_pista) {
                return res
                    .status(400)
                    .json({ message: "Limite de convites atingido sentimos muito." });
            }
        }

        // Gerar número de convite único para o anfitrião
        let numeroConvite;
        let conviteCheck;
        do {
            numeroConvite = `V${Math.floor(Math.random() * 90000) + 10000}`;
            conviteCheck = await pool.query(
                "SELECT * FROM convidados WHERE numero_convite = ?",
                [numeroConvite]
            );
        } while (conviteCheck.length > 0);

        // Inserir anfitrião no banco de dados
        await pool.query(
            `INSERT INTO convidados (nome_completo, cpf, tipodeconvidado, numero_convite, convite, email, empresa, telefone, data_inserido)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                nomeCompleto,
                cpf,
                "anfitrião",
                numeroConvite,
                tipoConvite,
                email,
                empresaCorretora,
                telefone,
            ]
        );

        let numeroConviteConvidado;
        let conviteConvidadoCheck;

        // Inserir convidado extra se necessário
        if (vaiLevarConvidado === "sim") {
            const cpfConvidadoCheck = await pool.query(
                "SELECT * FROM convidados WHERE cpf = ?",
                [cpfConvidado]
            );
            if (cpfConvidadoCheck.length > 0) {
                return res
                    .status(400)
                    .json({ message: "CPF do convidado já cadastrado." });
            }

            if (empresaConvidado) {
                const [empresaConvidadoData] = await pool.query(
                    "SELECT * FROM empresas WHERE id = ?",
                    [empresaConvidado]
                );
                if (!empresaConvidadoData.length) {
                    return res
                        .status(400)
                        .json({ message: "Empresa do convidado não encontrada." });
                }

                const convidadoRecord = empresaConvidadoData[0];

                if (tipoConvite === "camarote") {
                    const [vipCountConvidado] = await pool.query(
                        'SELECT COUNT(*) AS count FROM convidados WHERE empresa = ? AND convite = "camarote"',
                        [empresaConvidado]
                    );
                    if (vipCountConvidado[0].count >= convidadoRecord.convites_vip) {
                        return res
                            .status(400)
                            .json({ message: "Limite de convites atingido." });
                    }
                } else if (tipoConvite === "pista") {
                    const [pistaCountConvidado] = await pool.query(
                        'SELECT COUNT(*) AS count FROM convidados WHERE empresa = ? AND convite = "pista"',
                        [empresaConvidado]
                    );
                    if (pistaCountConvidado[0].count >= convidadoRecord.convites_pista) {
                        return res
                            .status(400)
                            .json({ message: "Limite de convites atingido." });
                    }
                }
            }

            do {
                numeroConviteConvidado = `V${Math.floor(Math.random() * 90000) + 10000
                    }`;
                conviteConvidadoCheck = await pool.query(
                    "SELECT * FROM convidados WHERE numero_convite = ?",
                    [numeroConviteConvidado]
                );
            } while (conviteConvidadoCheck.length > 0);

            await pool.query(
                `INSERT INTO convidados (nome_completo, cpf, tipodeconvidado, numero_convite, convite, email, telefone, data_inserido)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    nomeCompletoConvidado,
                    cpfConvidado,
                    "convidado",
                    numeroConviteConvidado,
                    tipoConvite,
                    emailConvidado,
                    telefoneConvidado,
                ]
            );
        }

        const dadosAnfitriao = {
            cpf: cpf,
            nomeCompleto: nomeCompleto,
            email: email,
            telefone: telefone,
            tipoConvite: tipoConvite,
            empresa: nomeEmpresaCorretora,
        };

        if (vaiLevarConvidado === "sim") {
            const dadosConvidado = {
                cpf: cpfConvidado,
                nomeCompleto: nomeCompletoConvidado,
                email: emailConvidado,
                telefone: telefoneConvidado,
                tipoConvite: tipoConvite,
                empresa: nomeEmpresaCorretora,
            };

            // Envia dados do anfitrião e do convidado
            await enviarDadosParaGoogleSheet({
                anfitriao: dadosAnfitriao,
                convidado: dadosConvidado,
            });
        } else {
            // Envia apenas dados do anfitrião
            await enviarDadosParaGoogleSheet({ anfitriao: dadosAnfitriao });
        }

        res.status(200).json({
            numeroConviteAnfitriao: numeroConvite,
            numeroConviteConvidado: numeroConviteConvidado || null,
            tipoConvite: tipoConvite,
            cpf: cpf,
            nomeCompleto: nomeCompleto,
            cpfConvidado: cpfConvidado,
            nomeCompletoConvidado: nomeCompletoConvidado,
        });
    } catch (err) {
        console.error("Erro:", err);
        res.status(500).json({ message: "Erro ao inserir dados" });
    } finally {
        pool.end();
    }
});

app.get("/sucesso", (req, res) => {
    const {
        numeroConviteAnfitriao,
        numeroConviteConvidado,
        tipoConvite,
        cpf,
        nomeCompleto,
        cpfConvidado,
        nomeCompletoConvidado,
    } = req.query;
    res.render("sucesso", {
        numeroConviteAnfitriao,
        numeroConviteConvidado,
        tipoConvite,
    });
});

app.get("/api/empresas", async function (req, res) {
    console.log("entrou aqui");
    const db = await mysql.createPool(config);
    try {
        const results = await db.query("SELECT * FROM empresas");
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar empresas" });
    } finally {
        await db.end(); // Fecha a conexão com o banco
    }
});

app.post("/error404", (res, req) => {
    res.render("404");
});


app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

app.use((err, req, res, next) => {
    // Registrar o erro usando o Winston
    logger.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
    });

    // Responder ao cliente com um status 500 e uma mensagem de erro genérica
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error({
        message: 'Unhandled Rejection at Promise',
        reason: reason,
        promise: promise,
    });
});

process.on('uncaughtException', (error) => {
    logger.error({
        message: 'Uncaught Exception',
        stack: error.stack,
    });

    // Opcional: terminar o processo para evitar um estado inconsistente
    process.exit(1);
});

app.use((req, res, next) => {
    res.status(404).render("404");
});
