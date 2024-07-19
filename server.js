import { createServer} from 'node:http';
import fs from 'node:fs';
import lerDadosUsuarios from './helper/lerdadosusuarios.js';
import * as formidable from 'formidable';
import {v4 as uuidv4} from 'uuid';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const PORT = 3333;


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename)
const server = createServer((request, response) =>{

    const {method, url} = request

    if(method === 'GET' && url === '/usuarios'){
        lerDadosUsuarios((err, usuarios) => {
            if(err){
                response.writeHead(500, {'Content-Type':'application/json'})
                response.end(JSON.stringify({message: 'Erro interno do servidor'}))
                return
            }
            response.writeHead(200, {'Content-Type':'application/json'})
            response.end(JSON.stringify(usuarios))
        })
    }else if(method === 'GET' && url.startsWith('/perfil/')){
        const id = url.split('/')[2]
        lerDadosUsuarios((err, usuarios) => {
            if(err){
                response.writeHead(500, {'Content-Type':'application/json'})
                response.end(JSON.stringify({message: 'Erro interno do servidor'}))
                return
            }

            const acharUsuario = usuarios.find((usuario) => usuario.perfil.id_usuario == id)
            const usuarioPerfil = acharUsuario.perfil
            if(!acharUsuario){
                response.writeHead(404, {'Content-Type':'application/json'})
                response.end(JSON.stringify({message: 'Perfil não encontrado'}))
                return
            }
            response.writeHead(200, {'Content-Type':'application/json'})
            response.end(JSON.stringify(usuarioPerfil))
        })
    }else if(method === 'POST' && url === '/usuarios'){
        let body = ''

        request.on('data', (chunck) => {
            body += chunck
        })

        request.on('end', () => {
            const novoUsuario = JSON.parse(body)
            lerDadosUsuarios((err, usuarios) => {
                if(err){
                    response.writeHead(500, {'Content-Type':'application/json'})
                    response.end(JSON.stringify({message: 'Erro interno do servidor'}))
                    return
                }
                novoUsuario.id = uuidv4()
                
                const verificarEmail = usuarios.find((usuario) => usuario.email_usuario == novoUsuario.email_usuario)

                if(verificarEmail){
                    response.writeHead(401, {'Content-Type':'application/json'})
                    response.end(JSON.stringify({message: 'Já possui usuário com este email'}))
                    return
                }

                usuarios.push(novoUsuario)
                fs.writeFile("usuarios.json", JSON.stringify(usuarios, null, 2), (err) => {
                    if(err){
                        response.writeHead(500, {'Content-Type':'application/json'})
                        response.end(JSON.stringify({message: 'Erro interno do servidor'}))
                        return
                    }
                    response.writeHead(201, {'Content-Type':'application/json'})
                    response.end(JSON.stringify({message: 'Usuário criado'}))
                })
            })
        })
    }else if(method === 'POST' && url === '/login'){ 
         let body = ""

         request.on('data', (chunck) => {
            body += chunck
         })

         request.on('end', () => {
            const login = JSON.parse(body)
            lerDadosUsuarios((err, usuarios) => {
                if(err){
                    response.writeHead(500, {'Content-Type':'application/json'})
                    response.end(JSON.stringify({message: 'Erro interno do servidor'}))
                    return
                }
                const usuarioLogin = usuarios.find((usuario) => usuario.email_usuario == login.email_usuario && usuario.senha_usuario == login.senha_usuario)
                if(!usuarioLogin){
                    response.writeHead(500, {'Content-Type':'application/json'})
                    response.end(JSON.stringify({message: 'Email ou senha não coincidem'}))
                    return
                }
                response.writeHead(200, {'Content-Type':'application/json'})
                response.end(JSON.stringify({message: 'Usuário Logado!'}))
            })
         })
    }else if(method === 'POST' && url.startsWith('/perfil/imagem/')){
            const id = url.split('/')[3]
                const form = new formidable.IncomingForm();
                
                lerDadosUsuarios((err, usuarios) => {
                    if(err){
                        response.writeHead(500, {'Content-Type':'application/json'})
                        response.end(JSON.stringify({message: 'Erro interno do servidor'}))
                        return
                    }
                    
                form.parse(request, (error, campos, arquivos) => {
                    if(error){
                        response.writeHead(500, {'Content-Type':'application/json'})
                        response.end(JSON.stringify({message: 'Erro interno no servidor'}))
                        return
                    }
                    const indexPerfil = usuarios.findIndex((usuario) => usuario.perfil.id_usuario[0] == id)
                    if(indexPerfil == -1){
                            response.writeHead(404, {'Content-Type':'application/json'})
                            response.end(JSON.stringify({message: 'Perfil não encontrado'}))
                            return
                    }
                const arquivo = arquivos.imagem[0]
                const urlAntiga = arquivo.filepath
                const urlNova = path.join(__dirname, 'uploads') + '/' + arquivo.originalFilename

                fs.rename(urlAntiga, urlNova, (erro) => {
                    if (erro) console.log(erro) 
                })

                usuarios[indexPerfil].perfil.imagem = urlNova
                fs.writeFile("usuarios.json", JSON.stringify(usuarios, null, 2), (err) => {
                    if(err){
                        response.writeHead(500, {'Content-Type':'application/json'})
                        response.end(JSON.stringify({message: 'Erro interno no servidor'}))
                        return
                    }
                    response.writeHead(200, {'Content-Type':'application/json'})
                    response.end(JSON.stringify({message: 'Foto Atualizada'}))
                })
            })
        })
       
    }else if(method === 'PUT' && url.startsWith('/perfil/')){
        const id = url.split('/')[2]
        const form = new formidable.IncomingForm();
                
                lerDadosUsuarios((err, usuarios) => {
                    if(err){
                        response.writeHead(500, {'Content-Type':'application/json'})
                        response.end(JSON.stringify({message: 'Erro interno do servidor'}))
                        return
                    }
                    
                form.parse(request, (error, campos, arquivos) => {
                    if(error){
                        response.writeHead(500, {'Content-Type':'application/json'})
                        response.end(JSON.stringify({message: 'Erro interno no servidor'}))
                        return
                    }
                    const indexPerfil = usuarios.findIndex((usuario) => usuario.perfil.id_usuario[0] == id)
                    if(indexPerfil == -1){
                            response.writeHead(404, {'Content-Type':'application/json'})
                            response.end(JSON.stringify({message: 'Perfil não encontrado'}))
                            return
                    }
                
                usuarios[indexPerfil].perfil = {...usuarios[indexPerfil].perfil, ...campos}
                fs.writeFile("usuarios.json", JSON.stringify(usuarios, null, 2), (err) => {
                    if(err){
                        response.writeHead(500, {'Content-Type':'application/json'})
                        response.end(JSON.stringify({message: 'Erro interno no servidor'}))
                        return
                    }
                    response.writeHead(200, {'Content-Type':'application/json'})
                    response.end(JSON.stringify({message: 'Perfil Atualizado'}))
                })
            })
        })
    }else if(method === 'POST' && url.startsWith('/perfil/')){
                const id = url.split('/')[2]
                const form = new formidable.IncomingForm();
                
                lerDadosUsuarios((err, usuarios) => {
                    if(err){
                        response.writeHead(500, {'Content-Type':'application/json'})
                        response.end(JSON.stringify({message: 'Erro interno do servidor'}))
                        return
                    }
                    
                form.parse(request, (error, campos, arquivos) => {
                    if(error){
                        response.writeHead(500, {'Content-Type':'application/json'})
                        response.end(JSON.stringify({message: 'Erro interno no servidor'}))
                        return
                    }
                    const indexPerfil = usuarios.findIndex((usuario) => usuario.id == id)
                    if(indexPerfil == -1){
                            response.writeHead(404, {'Content-Type':'application/json'})
                            response.end(JSON.stringify({message: 'Perfil não encontrado'}))
                            return
                    }
                const arquivo = arquivos.imagem[0]
                const urlAntiga = arquivo.filepath
                const urlNova = path.join(__dirname, 'uploads') + '/' + arquivo.originalFilename

                fs.rename(urlAntiga, urlNova, (erro) => {
                    if (erro) console.log(erro) 
                })

                campos.imagem = urlNova
                usuarios[indexPerfil].perfil = {...usuarios[indexPerfil].perfil, ...campos}
                fs.writeFile("usuarios.json", JSON.stringify(usuarios, null, 2), (err) => {
                    if(err){
                        response.writeHead(500, {'Content-Type':'application/json'})
                        response.end(JSON.stringify({message: 'Erro interno no servidor'}))
                        return
                    }
                    response.writeHead(200, {'Content-Type':'application/json'})
                    response.end(JSON.stringify({message: 'Perfil Criado!'}))
                })
            })
        })
    }else {
        response.writeHead(404, {'Content-Type':'application/json'})
        response.end(JSON.stringify({message: 'Rota não encontrada'}))
    }
})

server.listen(PORT, () => {
    console.log(`servidor on port ${PORT} 🚀`)
})