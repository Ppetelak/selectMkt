const {
    mysql,
    qInsImplantacao,
    qInsDependentes,
    config,
    qInsEntidade,
  } = require("./database");
const cors = require('cors');

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
app.use(cors({
    origin: 'https://selectoperadora.com.br'
}));

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

const logger = winston.createLogger({
    level: "error",
    format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
    ),
    transports: [
        new winston.transports.File({
        filename: path.join("erros", "error.log.json"),
        }),
    ],
});

app.get('/confirmar', (req, res) => {
    res.render('index');
});

app.post('/submit-form', async (req, res) => {
    console.log('Entrando na rota');
    const pool = await mysql.createPool(config);
    try {
        const {
            cpf,
            nomeCompleto,
            email,
            telefone,
            profissao,
            vaiLevarConvidado,
            cpfConvidado,
            nomeCompletoConvidado,
            emailConvidado,
            telefoneConvidado,
            profissaoConvidado,
            tipoConvite
        } = req.body;

        console.log('Dados recebidos:', req.body);

        // Verificar se o CPF já está cadastrado
        console.log('Verificando CPF do anfitrião:', cpf);
        const cpfCheck = await pool.query('SELECT * FROM convidados WHERE cpf = ?', [cpf]);
        console.log('Resultado da verificação de CPF do anfitrião:', cpfCheck);

        if (cpfCheck.length > 0) {
            console.log('CPF já cadastrado.');
            return res.status(400).json({ message: 'CPF já cadastrado.' });
        }

        // Gerar número de convite único para o anfitrião
        let numeroConvite;
        let conviteCheck;
        do {
            numeroConvite = `V${Math.floor(Math.random() * 90000) + 10000}`;
            console.log('Gerando número de convite:', numeroConvite);
            conviteCheck = await pool.query('SELECT * FROM convidados WHERE numero_convite = ?', [numeroConvite]);
            console.log('Resultado da verificação de número de convite:', conviteCheck);
        } while (conviteCheck.length > 0);

        // Inserir anfitrião no banco de dados
        console.log('Inserindo anfitrião no banco de dados');
        await pool.query(
            `INSERT INTO convidados (nome_completo, cpf, tipodeconvidado, numero_convite, convite, email, profissao, telefone, data_inserido)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [nomeCompleto, cpf, 'anfitrião', numeroConvite, tipoConvite, email, profissao, telefone]
        );

        let numeroConviteConvidado = null;
        // Inserir convidado extra se necessário
        if (vaiLevarConvidado === 'sim') {
            console.log('Vai levar convidado, verificando CPF do convidado:', cpfConvidado);
            const cpfConvidadoCheck = await pool.query('SELECT * FROM convidados WHERE cpf = ?', [cpfConvidado]);
            console.log('Resultado da verificação de CPF do convidado:', cpfConvidadoCheck);

            if (cpfConvidadoCheck.length > 0) {
                console.log('CPF do convidado já cadastrado.');
                return res.status(400).json({ message: 'CPF do convidado já cadastrado.' });
            }

            let conviteConvidadoCheck;
            do {
                numeroConviteConvidado = `V${Math.floor(Math.random() * 90000) + 10000}`;
                console.log('Gerando número de convite do convidado:', numeroConviteConvidado);
                conviteConvidadoCheck = await pool.query('SELECT * FROM convidados WHERE numero_convite = ?', [numeroConviteConvidado]);
                console.log('Resultado da verificação de número de convite do convidado:', conviteConvidadoCheck);
            } while (conviteConvidadoCheck.length > 0);

            console.log('Inserindo convidado no banco de dados');
            await pool.query(
                `INSERT INTO convidados (nome_completo, cpf, tipodeconvidado, numero_convite, convite, email, profissao, telefone, data_inserido)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [nomeCompletoConvidado, cpfConvidado, 'convidado', numeroConviteConvidado, tipoConvite, emailConvidado, profissaoConvidado, telefoneConvidado]
            );
        }

        console.log('Dados inseridos com sucesso. Enviando resposta.');
        res.status(200).json({
            numeroConviteAnfitriao: numeroConvite,
            numeroConviteConvidado: numeroConviteConvidado || null,
            tipoConvite: tipoConvite,
            cpf : cpf,
            nomeCompleto: nomeCompleto,
            cpfConvidado: cpfConvidado,
            nomeCompletoConvidado: nomeCompletoConvidado,
        });
    } catch (err) {
        console.error('Erro:', err);
        res.status(500).json({ message: 'Erro ao inserir dados' }); // Retorna um JSON em caso de erro
    } finally {
        pool.end();
    }
});

app.get('/sucesso', (req, res) => {
    const { numeroConviteAnfitriao, numeroConviteConvidado, tipoConvite, cpf, nomeCompleto, cpfConvidado, nomeCompletoConvidado } = req.query;
    res.render('sucesso', { numeroConviteAnfitriao, numeroConviteConvidado, tipoConvite, });
});


app.post("/error404", (res, req) => {
    res.render("404");
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
});

app.use((req, res, next) => {
    res.status(404).render("404");
});