import { Box, Text, TextField, Image, Button } from '@skynexui/components';
import React from 'react';
import appConfig from '../config.json';
import credencialsConfig from '../.env.json';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/router';
import { ButtonSendSticker } from '../src/components/ButtonSendSticker'

const SUPABASE_URL = credencialsConfig.SUPABASE_URL;
const SUPABASE_ANON_KEY = credencialsConfig.SUPABASE_ANON_KEY;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const escutaMensagensEmTempoReal = (adicionaMensagem) => {
	return supabaseClient
		.from('mensagens')
		.on('INSERT', (respostaLive) => {
			// console.log('Houve um novo insert');
			adicionaMensagem('insert', respostaLive.new);
		})
		.on('DELETE', (res) => {
			// console.log('Houve uma deleção', res.old.id);
			adicionaMensagem('detele', res.old.id);
		})
		.subscribe();
}

export default function ChatPage() {
	const router = useRouter();
	const usuarioLogado = router.query.username
	const [mensagem, setMensagem] = React.useState('');
	const [listaMensagem, setListaMensagem] = React.useState([]);


	React.useEffect(() => {
		supabaseClient.from('mensagens')
			.select('*')
			.order('id', { ascending: false })
			.then(({ data }) => {
				// console.log(data);
				setListaMensagem(data);
			});

		escutaMensagensEmTempoReal((executa, valor) => {
			if (executa == 'insert') {
				console.log('Nova mensagem: ', valor);
				//  USANDO COM FUNÇÃO E RECUPERA O VALOR ATUAL DA LISTA, OU SEJA, MOSTRA TODOS OS DADOS
				setListaMensagem((valorAtualDaLista) => {
					return [
						valor,
						...valorAtualDaLista,
					]
				})
				// USANDO DESSA FORMA ELE PEGA O PRIMEIRO REGISTRO DA LISTA NO REACT, OU SEJA VAZIA
				// setListaMensagem([
				// 	valor,
				// 	...listaMensagem,
				// ])			
			} else {
				setListaMensagem((valorAtualDaLista) => {
					const novaLista = valorAtualDaLista.filter(m => m.id != valor)
					return [
						...novaLista,
					]
				})

			}

		});

	}, [])

	const handleNovaMensagem = (novaMensagem) => {
		// const data = new Date();
		const mensagem = {
			de: usuarioLogado,
			texto: novaMensagem,
			// dataHora: `${data.toLocaleDateString()} - ${data.toLocaleTimeString()}`
		}

		supabaseClient
			.from('mensagens')
			.insert([
				mensagem
			])
			.then(({ data }) => {
				console.log('O que veio na resposta', data);
			})
		
			setMensagem('');

	}

	return (
		<Box
			styleSheet={{
				display: 'flex', alignItems: 'center', justifyContent: 'center',
				backgroundColor: appConfig.theme.colors.primary[500],
				backgroundImage: `url(https://virtualbackgrounds.site/wp-content/uploads/2020/08/the-matrix-digital-rain.jpg)`,
				backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundBlendMode: 'multiply',
				color: appConfig.theme.colors.neutrals['000']
			}}
		>
			<Box
				styleSheet={{
					display: 'flex',
					flexDirection: 'column',
					flex: 1,
					boxShadow: '0 2px 10px 0 rgb(0 0 0 / 20%)',
					borderRadius: '5px',
					backgroundColor: appConfig.theme.colors.neutrals[700],
					height: '100%',
					maxWidth: '95%',
					maxHeight: '95vh',
					padding: '32px',
				}}
			>
				<Header />
				<Box
					styleSheet={{
						position: 'relative',
						display: 'flex',
						flex: 1,
						height: '80%',
						backgroundColor: appConfig.theme.colors.neutrals[600],
						flexDirection: 'column',
						borderRadius: '5px',
						padding: '16px',
					}}
				>

					<MessageList mensagens={listaMensagem} />

					<Box
						as="form"
						styleSheet={{
							display: 'flex',
							alignItems: 'center',
						}}
					>
						<TextField
							value={mensagem}
							onChange={(event) => {
								const valor = event.target.value
								setMensagem(valor);
							}}
							onKeyPress={(event) => {
								if (event.key == "Enter") {
									event.preventDefault();
									handleNovaMensagem(mensagem);
								}
							}}
							placeholder="Insira sua mensagem aqui..."
							type="textarea"
							styleSheet={{
								width: '100%',
								border: '0',
								resize: 'none',
								borderRadius: '5px',
								padding: '6px 8px',
								backgroundColor: appConfig.theme.colors.neutrals[800],
								marginRight: '12px',
								color: appConfig.theme.colors.neutrals[200],
							}}
						/>

						<ButtonSendSticker
							onStickerClick={(sticker) => {
								// console.log('[USANDO O COMPONENTE] Salvar sticker no banco', sticker);
								handleNovaMensagem(`:sticker: ${sticker}`);
							}}
						/>

						<Button
							type='button'
							label='Enviar'
							onClick={(event) => {
								event.preventDefault();
								handleNovaMensagem(mensagem);
							}}
							buttonColors={{
								contrastColor: appConfig.theme.colors.neutrals["000"],
								mainColor: appConfig.theme.colors.primary[500],
								mainColorLight: appConfig.theme.colors.primary[400],
								mainColorStrong: appConfig.theme.colors.primary[600],
							}}
							styleSheet={{
								borderRadius: '5px',
								marginBottom: '10px',
								marginLeft: '10px',
								height: '80%'
							}}
						/>
					</Box>
				</Box>
			</Box>
		</Box>
	)
}

function Header() {
	return (
		<>
			<Box styleSheet={{ width: '100%', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} >
				<Text variant='heading5'>
					Chat
				</Text>
				<Button
					variant='tertiary'
					colorVariant='neutral'
					label='Logout'
					href="/"
				/>
			</Box>
		</>
	)
}

function MessageList(props) {

	const deletarMensagem = (mensagem) => {
		supabaseClient
			.from('mensagens')
			.delete()
			.match({ id: mensagem.id })
			.then(({ data, error }) => {
				if (data) {
					console.log('data: ', data);
				} 
				if (error) {
					console.log('error: ', error);
				}
			})
		
		// console.log(mensagem.texto);
		// console.log('Deletar mensagem com id: ', mensagem.id);
	}

	return (
		<Box
			tag="ul"
			styleSheet={{
				overflow: 'scroll',
				display: 'flex',
				flexDirection: 'column-reverse',
				flex: 1,
				color: appConfig.theme.colors.neutrals["000"],
				marginBottom: '16px',
			}}
		>

			{props.mensagens.map((mensagem) => {
				return (
					<Text
						key={mensagem.id}
						tag="li"
						styleSheet={{
							borderRadius: '5px',
							padding: '6px',
							marginBottom: '12px',
							hover: {
								backgroundColor: appConfig.theme.colors.neutrals[700],
							}
						}}
					>
						<Box
							styleSheet={{
								marginBottom: '8px',
								display: 'flex'
							}}
						>
							<Image
								styleSheet={{
									width: '20px',
									height: '20px',
									borderRadius: '50%',
									display: 'inline-block',
									marginRight: '8px',
								}}
								src={`https://github.com/${mensagem.de}.png`}
							/>
							<Text tag="strong">
								{mensagem.de}
							</Text>
							<Text
								tag="span"
								styleSheet={{
									fontSize: '10px',
									marginLeft: '10px',
									marginTop: '5px',
									color: appConfig.theme.colors.neutrals[300],
								}}
							>
								{mensagem.dataHora}
							</Text>
							<Text
								tag='strong'
								type='button'
								onClick={(event) => {
									event.preventDefault();
									deletarMensagem(mensagem);
								}}
								styleSheet={{
									marginLeft: '10px',
									cursor: 'pointer',
								}}
							>
								X
							</Text>
							{/* <Button
								type='button'
								label='X'
								onClick={(event) => {
									event.preventDefault();
									console.log('Apagar mensagem');
								}}
								buttonColors={{
									contrastColor: appConfig.theme.colors.neutrals["000"],
									mainColor: '#FF4747',
									mainColorStrong: '660000',
								}}
								styleSheet={{
									borderRadius: '50%',
									marginRight: '0',
									marginLeft: '80%',
									flexDirection: 'right'
								}}
							/> */}
						</Box>
						{/* [Declarativo] */}
            {mensagem.texto.startsWith(':sticker:')
              ? (
                <Image src={mensagem.texto.replace(':sticker:', '')} />
              )
              : (
                mensagem.texto
              )
						}
					</Text>
				)
			})}
		</Box>
	)
}