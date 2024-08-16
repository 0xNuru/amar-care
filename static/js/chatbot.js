document.addEventListener("DOMContentLoaded", function() {
    class Chatbox {
        constructor() {
            this.args = {
                openButton: document.querySelector('.chatbox__button'),
                chatBox: document.querySelector('.chatbox__support'),
                sendButton: document.querySelector('.send__button')
            }

            this.state = false;
            this.messages = [];
        }

        display() {
            const {openButton, chatBox, sendButton} = this.args;

            if (openButton && chatBox && sendButton) {
                openButton.addEventListener('click', () => this.toggleState(chatBox));
                sendButton.addEventListener('click', () => this.onSendButton(chatBox));

                const node = chatBox.querySelector('input');
                node.addEventListener("keyup", ({key}) => {
                    if (key === "Enter") {
                        this.onSendButton(chatBox);
                    }
                });
            } else {
                console.error("Chatbox elements not found in the DOM.");
            }
        }

        toggleState(chatbox) {
            this.state = !this.state;

            if (this.state) {
                chatbox.classList.add('chatbox--active');
            } else {
                chatbox.classList.remove('chatbox--active');
            }
        }

        async onSendButton(chatbox) {
            var textField = chatbox.querySelector('input');
            let text1 = textField.value;
            if (text1 === "") {
                return;
            }

            let msg1 = { name: "User", message: text1 };
            this.messages.push(msg1);

            try {
                // Await the fetch request to get products data
                const products = await fetch('/api/get_data').then(response => response.json());
            
                const productsString = products.map((product, index) => {
                    return `${index + 1}. Name: ${product.name}\n   Category: ${product.category}\n   Description: ${product.description}\n   Price: $${product.price}\n   Quantity available: ${product.stock}`;
                }).join('\n\n');  

                // Create the prompt using the formatted products list
                const prompt = `
                    User Input: "${text1}".

                    Context:
                    Here is the current list of products available:

                    ${productsString}
                `;
                console.log(prompt);

                // Now that you have the products data, proceed with the Gemini API call
                const geminiResponse = await fetch('https://medical-presciption-detector.onrender.com/chat', {  // Replace with your Gemini API endpoint
                    method: 'POST',
                    body: JSON.stringify({ message: prompt }),
                    mode: 'cors',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                });

                const geminiData = await geminiResponse.json();
                let msg2 = { name: "Chatbot", message: geminiData };
                this.messages.push(msg2);
                this.updateChatText(chatbox);
                textField.value = '';

            } catch (error) {
                console.error('Error:', error);
                let msg2 = { name: "Chatbot", message: "Sorry, there was an error processing your request." };
                this.messages.push(msg2);
                this.updateChatText(chatbox);
                textField.value = '';
            }
        }

        updateChatText(chatbox) {
            var html = '';
            this.messages.slice().reverse().forEach(function(item) {
                if (item.name === "Chatbot") {
                    html += '<div class="messages__item messages__item--visitor">' + item.message + '</div>';
                } else {
                    html += '<div class="messages__item messages__item--operator">' + item.message + '</div>';
                }
            });

            const chatmessage = chatbox.querySelector('.chatbox__messages');
            chatmessage.innerHTML = html;
        }
    }

    const chatbox = new Chatbox();
    chatbox.display();
});
