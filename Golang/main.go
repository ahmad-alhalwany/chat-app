package main

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

type Message struct {
	Type     string   `json:"type"`
	UserName string   `json:"userName,omitempty"`
	Data     string   `json:"data,omitempty"`
	Users    []string `json:"users,omitempty"`
}

var (
	clients     = make(map[*websocket.Conn]string)
	broadcaster = make(chan Message)
	mutex       = sync.Mutex{}
)

func handleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	var username string

	log.Printf("Client connected: %s", conn.RemoteAddr().String())

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Read error: %v", err)
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("JSON Unmarshal error: %v", err)
			continue
		}

		switch msg.Type {
		case "login":
			username = msg.UserName
			mutex.Lock()
			clients[conn] = username
			mutex.Unlock()

			response := Message{
				Type:     "welcome",
				UserName: username,
				Data:     "Welcome to the chat, " + username,
			}
			if err := conn.WriteJSON(response); err != nil {
				log.Printf("Write error: %v", err)
			}

			broadcastUserList()

			log.Printf("User logged in: %s", username)

		case "message":
			log.Printf("Message from %s: %s", msg.UserName, msg.Data)
			broadcaster <- msg
		}
	}

	mutex.Lock()
	delete(clients, conn)
	mutex.Unlock()

	broadcastUserList()

	log.Printf("Client disconnected: %s", conn.RemoteAddr().String())
}

func broadcastUserList() {
	mutex.Lock()
	defer mutex.Unlock()

	var activeUsers []string
	for _, user := range clients {
		activeUsers = append(activeUsers, user)
	}

	log.Printf("Broadcasting active users: %v", activeUsers)

	message := Message{
		Type:  "userJoined",
		Users: activeUsers,
	}

	for client := range clients {
		if err := client.WriteJSON(message); err != nil {
			log.Printf("Error sending user list: %v", err)
			client.Close()
			delete(clients, client)
		}
	}
}

func handleMessages() {
	for {
		msg := <-broadcaster

		mutex.Lock()
		for client := range clients {
			if err := client.WriteJSON(Message{
				Type:     "message",
				UserName: msg.UserName,
				Data:     msg.Data,
			}); err != nil {
				log.Printf("Error sending message: %v", err)
				client.Close()
				delete(clients, client)
			}
		}
		mutex.Unlock()
	}
}

func main() {
	http.HandleFunc("/ws", handleConnection)

	go handleMessages()

	log.Println("Server started on port 8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
