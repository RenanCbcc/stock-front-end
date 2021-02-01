﻿import React, { useState } from 'react';
import MaterialTable from 'material-table';
import Alert from '@material-ui/lab/Alert';
import AddShoppingCartIcon from '@material-ui/icons/AddShoppingCart';
import PaymentIcon from '@material-ui/icons/Payment';
import Api from '../../services/Api'
import { isPhoneNumberValid, isNameValid, isAddressValid } from '../../validators/Validator'
const baseURL = "https://estoquapp.herokuapp.com/api/Client";

const isOk = (response) => {
    if (response !== null && response.ok) {
        return response;
    } else {
        throw Error(response.status);
    }
}

const columns =
    [
        { title: "id", field: "id", hidden: true },
        {
            title: 'Nome', field: 'name', type: 'string',
            validate: (rowData) => ((rowData.name != null && isNameValid(rowData.name))
                ? true : '⚠️ Nome deve ter entre 5 e 50 caracteres.')
        },
        {
            title: 'Endereço', field: 'address', type: 'string',
            validate: rowData => ((rowData.address != null && isAddressValid(rowData.address))
                ? true : '⚠️ Endereço deve ter entre 10 e 100 caracteres.')
        },
        {
            title: 'Telefone', field: 'phoneNumber', type: 'string',
            validate: rowData => ((rowData.phoneNumber != null && isPhoneNumberValid(rowData.phoneNumber))
                ? true : '⚠️ O número deve deve estar no formato: (xx)xxxxx-xxxx.')
        },
        {
            title: 'Status', field: 'status', lookup: { 0: 'Inativo', 1: 'Ativo' }, editable: 'never'
        },
        {
            title: 'Débito', field: 'debt', type: 'currency', editable: 'never'
        },
        {
            title: 'Última compra', field: 'lastPurchase', type: 'date', editable: 'never'
        },
    ];

const localization = {
    body: {
        emptyDataSourceMessage: 'Nenhum registro para exibir',
        addTooltip: 'Adicionar',
        deleteTooltip: 'Apagar',
        editTooltip: 'Editar',
        editRow: {
            deleteText: 'Voulez-vous supprimer cette ligne?',
            cancelTooltip: 'Cancelar',
            saveTooltip: 'Salvar'
        }
    },
    toolbar: {
        searchTooltip: 'Pesquisar',
        searchPlaceholder: 'Pesquisar',
        exportTitle: 'Exportar',
        exportAriaLabel: 'Exportar',
    },
    pagination: {
        labelRowsSelect: 'linhas',
        labelDisplayedRows: '{count} de {from}-{to}',
        firstTooltip: 'Primeira página',
        previousTooltip: 'Página anterior',
        nextTooltip: 'Próxima página',
        lastTooltip: 'Última página'
    },
    header: {
        actions: 'Ações'
    }
}
const operations = (query, data) => {
    //Searching
    data = data.filter(p =>
        p.name.toLowerCase().includes(query.search.toLowerCase()) ||
        p.address.toLowerCase().includes(query.search.toLowerCase()) ||
        p.phoneNumber.includes(query.search) ||
        p.debt.toString().includes(query.search)
    )
    //Sorting 
    if (query.orderBy != null) {
        let orderBy = query.orderBy.field;
        data.sort(function (a, b) {
            if (b[orderBy] < a[orderBy]) {
                return -1;
            }
            if (b[orderBy] > a[orderBy]) {
                return 1;
            }
            return 0;
        });
    }
    return data;
};

export default function Client(props) {
    const [data, setData] = useState([]);
    const [errorMessages, setErrorMessages] = useState('');
    const [iserror, setIserror] = useState(false);


    const handleRowAdd = (newData, resolve) => {
        fetch(baseURL, {
            method: 'Post',
            headers: { 'Content-type': 'application/json' },
            body: JSON.stringify(newData)
        })
            .then(res => isOk(res))
            .then(response => response.json())
            .then(product => {
                let dataToAdd = [...data];
                dataToAdd.push(product);
                setData(dataToAdd);
                resolve()
                setErrorMessages([])
                setIserror(false)
            })
            .catch(error => {
                setErrorMessages(`Não foi possível enviar os dados ao servidor. ${error}`)
                setIserror(true)
                resolve()
            })
    }

    const handleRowUpdate = (newData, oldData, resolve) => {
        newData.status = Number(newData.status);
        fetch(baseURL,
            {
                method: 'Put',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify(newData)
            })
            .then(res => isOk(res))
            .then(response => response.json())
            .then(product => {
                const dataUpdate = [...data];
                const index = oldData.tableData.id;
                dataUpdate[index] = product;
                setData([...dataUpdate]);
                resolve()
                setIserror(false)
                setErrorMessages([])
            })
            .catch(error => {
                setErrorMessages(`Não foi possível atualizar o cliente. ${error}`)
                setIserror(true)
                resolve()
            })

    }

    return (
        <>
            <div>
                {iserror &&
                    <Alert severity="error">{errorMessages}</Alert>
                }
            </div>
            <MaterialTable
                title="Clientes"
                columns={columns}
                localization={localization}
                options={{
                    exportButton: true,
                    headerStyle: {
                        backgroundColor: '#01579b',
                        color: '#FFF'
                    }
                }}
                data={query =>
                    new Promise((resolve, reject) => {
                        let api = new Api('Client');
                        api.Get(query)
                            .then(result => {
                                resolve({
                                    data: operations(query, result.data),
                                    page: result.page - 1,
                                    totalCount: result.total
                                })
                            })
                    })
                }
                actions={[
                    {
                        icon: () => <AddShoppingCartIcon />,
                        tooltip: 'Nova venda',
                        onClick: (event, rowData) => props.history.push(`/sale/client/${rowData.id}`)
                    }
                    , {
                        icon: () => <PaymentIcon />,
                        tooltip: 'Pagar',
                        onClick: (event, rowData) =>
                            props
                                .history
                                .push(`/payment/client/${rowData.id}`)
                    }
                ]}
                editable={{
                    onRowAdd: newData =>
                        new Promise((resolve) => {
                            handleRowAdd(newData, resolve)
                        }),
                    onRowUpdate: (newData, oldData) =>
                        new Promise((resolve) => {
                            handleRowUpdate(newData, oldData, resolve);
                        }),
                }}
            />
        </>
    )
};
