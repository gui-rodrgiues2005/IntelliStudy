// src/components/Imput/Imput.jsx
import React from "react";
import {
    Plus,
    Paperclip,
    MoveUp,
    X,
    FileText,
    Loader2,
    BookOpen,
} from "lucide-react";
import './Imput.scss';

const Imput = ({
    content,
    setContent,

    uploadedFile,
    setUploadedFile,

    isSending,
    onSendMessage,     // <<--- NOVO: função que envia mensagens
}) => {

    const canSend = !isSending && (content || uploadedFile);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (canSend) onSendMessage();
        }
    };

    return (
        <div className="imput-wrapper">
            <div className="imput-content">
                <div className={`imput-container`}>

                    {/* ÁREA SUPERIOR - TEXTAREA */}
                    <div className="input-area">
                        <textarea
                            className="input-textarea"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    {/* ÁREA INFERIOR - BOTÕES */}
                    <div className="input-bottom-area">

                        <div className="input-left-buttons">
                            {uploadedFile && (
                                <div className="file-indicator">
                                    <FileText size={14} />
                                    <span>{uploadedFile.name}</span>
                                    <button className="remove-file-btn" onClick={() => setUploadedFile(null)}>
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="input-right-buttons">

                            {/* BOTÃO UPLOAD */}
                            <button
                                className="btn-upload"
                                onClick={() => document.getElementById("file-upload").click()}
                            >
                                <Paperclip size={20} />
                            </button>

                            {/* BOTÃO ENVIAR */}
                            <button
                                className="btn-send"
                                disabled={!canSend}
                                onClick={() => canSend && onSendMessage()}
                            >
                                {isSending
                                    ? <Loader2 size={20} className="spin" />
                                    : <MoveUp size={20} />
                                }
                            </button>
                        </div>

                    </div>

                    <input
                        type="file"
                        id="file-upload"
                        className="file-input-hidden"
                        onChange={(e) => setUploadedFile(e.target.files[0])}
                    />
                </div>
            </div>
        </div>
    );
};

export default Imput;
