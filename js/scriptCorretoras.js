console.log('Entrou aqui')
let linkProd = 'https://select.midiaideal.net';
let linkDev = 'http://localhost:9898';

let link = linkDev;

function validarCPF(cpf) {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    return true;
}

$(document).ready(function() {
    function checkCPF(inputId, errorSpanId) {
        const cpf = $(`#${inputId}`).val();
        if (validarCPF(cpf)) {
            $(`#${errorSpanId}`).hide();
            return true;
        } else {
            $(`#${errorSpanId}`).show();
            return false;
        }
    }

    $('#cpf').on('blur', function() {
        checkCPF('cpf', 'cpfError');
        toggleSubmitButton();
    });

    $('#cpfConvidado').on('blur', function() {
        checkCPF('cpfConvidado', 'cpfConvidadoError');
        toggleSubmitButton();
    });

    $('#vaiLevarConvidado').change(function() {
        if ($(this).val() === 'sim') {
            $('#convidadoExtra').show();
        } else {
            $('#convidadoExtra').hide();
        }
        toggleSubmitButton();
    });

    function toggleSubmitButton() {
        const isCPFValid = checkCPF('cpf', 'cpfError');
        const isConvidadoCPFValid = $('#vaiLevarConvidado').val() === 'sim' ? checkCPF('cpfConvidado', 'cpfConvidadoError') : true;
        $('#submitBtn').prop('disabled', !(isCPFValid && isConvidadoCPFValid));
    }

    $('#guestForm').submit(function(e) {
        console.log('Entrou aqui no submit de envio do formulário');
        $('#submitBtn').prop('disabled', true);
        $('#loadingSpinner').show();
        e.preventDefault();
        const formData = $(this).serialize();
        
        // Obter o parâmetro da URL
        const urlParams = new URLSearchParams(window.location.search);
        const parametro = urlParams.get('empresa');
        console.log(parametro);
        $.post(`${link}/submit-form-corretoras?parametro=${parametro}`, formData)
            .done(function(response) {
                window.location.href = `https://selectoperadora.com.br/eventos/confirmacao/?numeroConviteAnfitriao=${response.numeroConviteAnfitriao}&numeroConviteConvidado=${response.numeroConviteConvidado || ''}&tipoConvite=${response.tipoConvite}&cpf=${response.cpf}&nomeCompleto=${response.nomeCompleto}&cpfConvidado=${response.cpfConvidado}&nomeCompletoConvidado=${response.nomeCompletoConvidado}`;
            })
            .fail(function(jqXHR) {
                const errorMessage = jqXHR.responseJSON.message || 'Ocorreu um erro desconhecido.';
                $('#errorMessage').text(errorMessage);
                $('#errorModal').modal('show');
            })
            .always(function() {
                $('#submitBtn').prop('disabled', false);
                $('#loadingSpinner').hide();
            });
    });
    
});