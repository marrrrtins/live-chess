import React, { useState, useEffect, useContext, useRef } from 'react'
import io from 'socket.io-client'

const GamesContext = React.createContext()

export function useGame() {
  return useContext(GamesContext)
}


import { generateId } from '../helpers'
import Chess from '../lib/chess'

import { useSocket } from './SocketContext'
import { useUser } from './UserContext'

export function GamesProvider({ children }) {
  const socket = useSocket()
  const [game, setGame] = useState()
  const [moves, setMoves] = useState()
  const [orientation, setOrientation] = useState()
  const [players, setPlayers] = useState([])
  const [turn, setTurn] = useState(false)
  const [gameOver, setGameOver] = useState({})
  const [fen, setFen] = useState('')
  const [fenArr, setFenArr] = useState([])
  const [lastMove, setLastMove] = useState()
  const [publicGame, setPublicGame] = useState(false)
  const [opponent, setOpponent] = useState()
  const [timeLeft, setTimeLeft] = useState()
  const moveSoundRef = useRef()
  const captureSoundRef = useRef()
  const playerJoinedRef = useRef()
  const { id } = useUser()

  useEffect(() => {
    if(!socket) return
    socket.on('game', initGame)
    socket.on('players', _players => {
      setPlayers(_players)
      playerJoinedRef.current.currentTime = 0
      playerJoinedRef.current.play()
    })
  }, [socket])  

  function initGame(gameData) {
    const g = new Chess()
    const fenHistory = []
    let _lastMove;
    for(var i = 0; i < gameData.moves.length; i++) {
      _lastMove = g.move(gameData.moves[i])
      fenHistory.push(g.fen()) // an array that holds the fen after each move
    }
    setLastMove(_lastMove)
    setFenArr(fenHistory)
    setPublicGame(gameData.isPublic)
    let _orientation = gameData.players.findIndex(p => p.id === id) === 0 ? 'white' : 'black'
    setOrientation(_orientation)
    setMoves(gameData.moves)
    setTurn(g.turn() === _orientation[0])
    setPlayers(gameData.players)
    setFen(g.fen())
    setGame(g)
    setGameOver(getGameOver(g))
  }

  useEffect(() => {
    if(!socket) return
    socket.on('move', m => makeMove(m))
    return () => socket.off('move')
  }, [socket, game, moves])

  useEffect(() => {
    if(!game || !orientation) return
    setTurn(game.turn() === orientation[0])
  }, [game, orientation])

  function getGameOver(game) {
    if(!game.game_over()) return
    let obj = {}
    if(game.in_checkmate()) {
      obj.reason = 'checkmate'
      obj.winner = game.turn() === 'w' ? 'black' : 'white'
      obj.result = obj.winner === 'white' ? '1-0' : '0-1'
    }else {
      if(game.in_threefold_repetition()) {
        obj.reason = 'threefold repetition'
      }else if(game.insufficient_material()) {
        obj.reason = 'insufficient material'
      }
      obj.result = '½-½'
    }
    return obj
  }

  useEffect(() => {
    if(!game) return
    if(game.game_over()) {
      setGameOver(getGameOver(game))
    }
  }, [game])

  function createGame(data) {
    socket.emit('create', data)
  }

  function makePublic() {
    setPublicGame(true)
  }

  function setMove(index) {
    if(index < 0 || index >= fenArr.length) return
    setLastMove(null)
    setFen(fenArr[index])
  }

  function makeMove(move) {
    if(!game) return
    if(game.game_over()) return
    const saveGame = { ...game }
    let testMove = saveGame.move(move)
    if(testMove) {
      setMoves(prev => [...prev, testMove.san])
      setGame(saveGame)
      setFenArr(prev => [...prev, saveGame.fen()])
      setFen(saveGame.fen())
      setLastMove(testMove)
      if(/x/.test(testMove.san)) {
        captureSoundRef.current.currentTime = 0
        captureSoundRef.current.play()
      }else {
        moveSoundRef.current.currentTime = 0
        moveSoundRef.current.play()
      }
    }
    return testMove
  }

  function safeGameMutate(modify) {
    setGame((g) => {
      const update = { ...g };
      modify(update);
      return update;
    });
  }

  function rematch() {
    let g = new Chess()
    setGame()
    setOrientation(orientation === 'white' ? 'black' : 'white')
    setMoves([])
    setLastMove(g.fen())
    setGameOver(null)
    setFen(g.fen())
  }

  const value = {
    game,
    createGame,
    makeMove,
    moves,
    players,
    orientation,
    turn,
    gameOver,
    fen,
    setMove,
    lastMove,
    publicGame, 
    makePublic,
    initGame,
    opponent
  }
  return (
    <GamesContext.Provider value={value}>
      <audio src='/sound/move.mp3' ref={moveSoundRef}></audio>
      <audio src='/sound/alert.mp3' ref={playerJoinedRef}></audio>
      <audio src='/sound/capture.mp3' ref={captureSoundRef}></audio>
      { children }
    </GamesContext.Provider>
  )
}