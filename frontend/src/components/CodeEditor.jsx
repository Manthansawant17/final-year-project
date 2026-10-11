import React, { useState } from 'react'
import { Copy, Check, Download, Play } from 'lucide-react'

const SAMPLE_FILES = {
  'AppController': {
    name: 'AppController.java',
    lang: 'java',
    content: `package com.company.service;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1")
public class AppController {

    private final AppService appService;

    public AppController(AppService appService) {
        this.appService = appService;
    }

    @GetMapping("/data")
    public ResponseEntity<Data> getData() {
        Optional<Data> result = appService.getData();
        return result
            .map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/status")
    public ResponseEntity<String> getStatus() {
        return ResponseEntity.ok("Service is running smoothly (v1.0.0)");
    }
}`,
  },
  'AppService': {
    name: 'AppService.java',
    lang: 'java',
    content: `package com.company.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Optional;

@Service
public class AppService {

    private static final Logger logger = LoggerFactory.getLogger(AppService.class);
    private final DataRepository repository;

    public AppService(DataRepository repository) {
        this.repository = repository;
    }

    /**
     * Refactored in PR #452 to safely handle potential NullPointerExceptions
     */
    public Optional<Data> getData() {
        try {
            Data data = repository.fetchData();
            return Optional.ofNullable(data);
        } catch (Exception ex) {
            logger.error("Failed to fetch data from repository: {}", ex.getMessage());
            return Optional.empty();
        }
    }
}`,
  },
}

export default function CodeEditor({ tabId }) {
  const [copied, setCopied] = useState(false)
  const file = SAMPLE_FILES[tabId] || {
    name: `${tabId}.java`,
    lang: 'java',
    content: `// Source file: ${tabId}\n// Select files from the sidebar or PR diff to inspect.`,
  }

  const lines = file.content.split('\n')

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-ide-bg overflow-hidden text-xs font-mono">
      {/* Editor toolbar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-ide-sidebar border-b border-ide-border shrink-0 text-ide-text">
        <div className="flex items-center gap-2">
          <span className="text-ide-text-bright font-semibold">{file.name}</span>
          <span className="text-[10px] text-ide-text/40">({lines.length} lines)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-ide-border text-ide-text hover:text-ide-text-bright transition-colors cursor-pointer"
          >
            {copied ? <Check size={12} className="text-ide-green" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Code lines */}
      <div className="flex-1 overflow-auto p-2">
        {lines.map((line, idx) => (
          <div key={idx} className="flex hover:bg-ide-panel/50 transition-colors leading-relaxed">
            <span className="w-10 text-right pr-4 text-ide-text/30 select-none border-r border-ide-border/40 shrink-0">
              {idx + 1}
            </span>
            <pre className="pl-4 text-ide-text-bright overflow-x-auto">{line || ' '}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}
