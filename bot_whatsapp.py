import json
from datetime import datetime

ARQUIVO_INQUILINOS = 'inquilinos.json'
ARQUIVO_PAGAMENTOS = 'pagamentos.json'

def carregar_arquivo(nome_arquivo):
    try:
        with open(nome_arquivo, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def salvar_arquivo(nome_arquivo, dados):
    with open(nome_arquivo, 'w', encoding='utf-8') as f:
        json.dump(dados, f, indent=2, ensure_ascii=False)

def input_data(mensagem):
    while True:
        entrada = input(mensagem).strip()
        if entrada:
            return entrada

def validar_data(data_texto):
    try:
        datetime.strptime(data_texto, '%d/%m/%Y')
        return True
    except ValueError:
        return False

# INQUILINOS
def registrar_inquilino():
    print("Vamos registrar um novo inquilino.")
    nome = input_data("Nome do inquilino: ")
    telefone = input_data("Telefone: ")
    email = input_data("Email: ")

    while True:
        data_inicio = input_data("Data de início (dd/mm/aaaa): ")
        if validar_data(data_inicio):
            break
        print("Data inválida, tente no formato dd/mm/aaaa.")

    while True:
        data_saida = input_data("Data de saída (dd/mm/aaaa) (ou N/A se indefinido): ")
        if data_saida.lower() == 'n/a' or data_saida == '':
            data_saida = None
            break
        if validar_data(data_saida):
            break
        print("Data inválida, tente no formato dd/mm/aaaa ou digite N/A.")

    inquilino = {
        'nome': nome,
        'telefone': telefone,
        'email': email,
        'data_inicio': data_inicio,
        'data_saida': data_saida
    }

    inquilinos = carregar_arquivo(ARQUIVO_INQUILINOS)

    duplicado = any(i['nome'].lower() == nome.lower() and i['telefone'] == telefone for i in inquilinos)
    if duplicado:
        print(f"Inquilino '{nome}' já está registrado. Cancelando.")
        return

    inquilinos.append(inquilino)
    salvar_arquivo(ARQUIVO_INQUILINOS, inquilinos)
    print(f"Inquilino {nome} registrado com sucesso!")

def apagar_inquilino():
    nome = input_data("Digite o nome do inquilino para apagar: ")
    inquilinos = carregar_arquivo(ARQUIVO_INQUILINOS)
    inquilinos_novos = [i for i in inquilinos if i['nome'].lower() != nome.lower()]
    if len(inquilinos_novos) == len(inquilinos):
        print(f"Nenhum inquilino chamado '{nome}' foi encontrado.")
    else:
        salvar_arquivo(ARQUIVO_INQUILINOS, inquilinos_novos)
        print(f"Inquilino '{nome}' removido com sucesso!")

# PAGAMENTOS
def registrar_pagamento_interativo():
    inquilinos = carregar_arquivo(ARQUIVO_INQUILINOS)
    if not inquilinos:
        print("Nenhum inquilino registrado. Registre um inquilino antes de registrar pagamentos.")
        return

    nomes_inquilinos = [i['nome'].lower() for i in inquilinos]

    while True:
        nome = input_data("Digite o nome do inquilino que fez o pagamento: ").strip()
        if nome.lower() in nomes_inquilinos:

            nome_original = next(i['nome'] for i in inquilinos if i['nome'].lower() == nome.lower())
            break
        print("Inquilino não encontrado. Tente novamente.")

    while True:
        valor_str = input_data("Digite o valor pago (somente números, ex: 1200 ou 1500.50): ").replace(',', '.')
        try:
            valor = float(valor_str)
            if valor <= 0:
                print("Valor deve ser maior que zero.")
                continue
            break
        except ValueError:
            print("Valor inválido. Digite um número válido.")

    data_hoje = datetime.now().date().isoformat()

    pagamento = {
        'nome': nome_original,
        'data': data_hoje,
        'valor': valor
    }

    pagamentos = carregar_arquivo(ARQUIVO_PAGAMENTOS)
    pagamentos.append(pagamento)
    salvar_arquivo(ARQUIVO_PAGAMENTOS, pagamentos)

    print(f"Registro de pagamento registrado! Inquilino: {nome_original}, Valor: R$ {valor:.2f}, Data: {data_hoje}")

def exibir_resumo_pagamentos():
    pagamentos = carregar_arquivo(ARQUIVO_PAGAMENTOS)
    if not pagamentos:
        print("Nenhum pagamento registrado ainda.")
        return

    total_por_nome = {}
    total_mes = 0.0
    contagem_por_nome = {}

    mes_atual = datetime.now().month
    ano_atual = datetime.now().year

    for p in pagamentos:
        nome = p['nome']
        valor = p.get('valor', 0)
        data = datetime.strptime(p['data'], '%Y-%m-%d')

        if data.month == mes_atual and data.year == ano_atual:
            total_mes += valor

        total_por_nome[nome] = total_por_nome.get(nome, 0) + valor
        contagem_por_nome[nome] = contagem_por_nome.get(nome, 0) + 1

    print(f"\n--- RESUMO DOS PAGAMENTOS ---")
    print(f"Total recebido no mês atual: R$ {total_mes:.2f}")
    print(f"\nPagamentos por inquilino:")
    for nome in total_por_nome:
        print(f" - {nome}: R$ {total_por_nome[nome]:.2f} em {contagem_por_nome[nome]} pagamento(s)")

def main():

    while True:
        texto = input("\nVocê: ").strip().lower()
        if texto == "sair":
            print("Encerrando o sistema. Até logo!")
            break
        elif texto == "oi":
            print("IA: Olá Marcos, o que posso te ajudar?")
        elif "registrar" in texto and "inquilino" in texto:
            registrar_inquilino()
        elif "apagar" in texto and "inquilino" in texto:
            apagar_inquilino()
        elif "registrar" in texto and "pagamento" in texto:
            registrar_pagamento_interativo()
        elif "resumo" in texto:
            exibir_resumo_pagamentos()
        else:
            print("IA: Não entendi. Use:\n"
                  "- 'registrar um inquilino'\n"
                  "- 'apagar um inquilino'\n"
                  "- 'registrar pagamento' para adicionar um pagamento\n"
                  "- 'resumo' para ver os totais\n"
                  "- 'sair' para encerrar.")

if __name__ == "__main__":
    main()