'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Files, Search, GitBranch, Settings, Play, Terminal, ChevronDown, X, FileCode2, FileJson, FileType, FolderOpen, FilePlus, Download, Maximize2, Minimize2, User, Bell, Blocks, Zap, Keyboard, BookOpen, Crown } from 'lucide-react';
import Editor from '@monaco-editor/react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export default function VSCodeInterface() {
  const [fileSystem, setFileSystem] = useState<Record<string, string>>({});
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [openFiles, setOpenFiles] = useState<string[]>([]);
  const [activeSidebar, setActiveSidebar] = useState<'explorer' | 'search'>('explorer');
  const [searchQuery, setSearchQuery] = useState('');
  const [folderName, setFolderName] = useState<string | null>(null);
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'file' | 'folder', target: string } | null>(null);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  
  // Terminal State
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<{type: 'input' | 'output' | 'error', text: string}[]>([
    { type: 'output', text: 'Ergili İde Terminaline Hoş Geldiniz.' },
    { type: 'output', text: 'Yardım için "help" yazabilirsiniz.' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Layout State
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [terminalHeight, setTerminalHeight] = useState(200);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);
  
  // Ayarlar State
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const [editorTheme, setEditorTheme] = useState('vs-dark');
  const [editorFontSize, setEditorFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [minimapEnabled, setMinimapEnabled] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedFS = localStorage.getItem('vsc-filesystem');
    const savedFolder = localStorage.getItem('vsc-foldername');
    const savedTheme = localStorage.getItem('vsc-theme');
    const savedFontSize = localStorage.getItem('vsc-fontsize');
    const savedWordWrap = localStorage.getItem('vsc-wordwrap');
    const savedMinimap = localStorage.getItem('vsc-minimap');
    const savedOpenFiles = localStorage.getItem('vsc-openfiles');
    const savedActiveFile = localStorage.getItem('vsc-activefile');

    if (savedFS) {
      try { setFileSystem(JSON.parse(savedFS)); } catch (e) {}
    }
    if (savedFolder) setFolderName(savedFolder);
    if (savedTheme) setEditorTheme(savedTheme);
    if (savedFontSize) setEditorFontSize(Number(savedFontSize));
    if (savedWordWrap) setWordWrap(savedWordWrap as 'on' | 'off');
    if (savedMinimap) setMinimapEnabled(savedMinimap === 'true');
    if (savedOpenFiles) {
      try { setOpenFiles(JSON.parse(savedOpenFiles)); } catch (e) {}
    }
    if (savedActiveFile) setActiveFile(savedActiveFile);
    
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded && Object.keys(fileSystem).length > 0) {
      localStorage.setItem('vsc-filesystem', JSON.stringify(fileSystem));
    }
  }, [fileSystem, isLoaded]);

  useEffect(() => {
    if (isLoaded && folderName) {
      localStorage.setItem('vsc-foldername', folderName);
    }
  }, [folderName, isLoaded]);

  useEffect(() => {
    if (isTerminalOpen && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory, isTerminalOpen]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSidebar) {
        const newWidth = Math.max(160, Math.min(e.clientX - 48, 400)); // 48px is activity bar width
        setSidebarWidth(newWidth);
      }
      if (isDraggingTerminal) {
        const newHeight = Math.max(100, Math.min(window.innerHeight - e.clientY - 24, window.innerHeight - 200)); // 24px is status bar height
        setTerminalHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
      setIsDraggingTerminal(false);
    };

    if (isDraggingSidebar || isDraggingTerminal) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSidebar, isDraggingTerminal]);

  const handleTerminalCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && terminalInput.trim()) {
      const cmd = terminalInput.trim();
      setTerminalHistory(prev => [...prev, { type: 'input', text: `C:\\Users\\Ergili\\Projem> ${cmd}` }]);
      
      let output = '';
      let isError = false;

      switch (cmd.toLowerCase()) {
        case 'help':
          output = 'Kullanılabilir komutlar:\n- help: Bu yardım menüsünü gösterir\n- clear: Terminali temizler\n- ls / dir: Dosyaları listeler\n- date: Geçerli tarihi gösterir\n- run: Projeyi çalıştırır\n- echo [mesaj]: Mesajı ekrana yazdırır';
          break;
        case 'clear':
          setTerminalHistory([]);
          setTerminalInput('');
          return;
        case 'ls':
        case 'dir':
          output = Object.keys(fileSystem).length > 0 
            ? Object.keys(fileSystem).join('\n') 
            : 'Klasör boş.';
          break;
        case 'date':
          output = new Date().toLocaleString();
          break;
        case 'run':
          handleRun();
          output = 'Proje başlatılıyor...';
          break;
        default:
          if (cmd.toLowerCase().startsWith('echo ')) {
            output = cmd.substring(5);
          } else {
            output = `'${cmd}' iç ya da dış komut, çalıştırılabilir program ya da toplu iş dosyası olarak tanınmıyor.`;
            isError = true;
          }
      }

      setTerminalHistory(prev => [...prev, { type: isError ? 'error' : 'output', text: output }]);
      setTerminalInput('');
    }
  };

  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch(ext) {
      case 'js': return 'javascript';
      case 'ts': return 'typescript';
      case 'jsx': return 'javascript';
      case 'tsx': return 'typescript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      default: return 'plaintext';
    }
  };

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.html')) return <FileCode2 size={14} className="text-orange-500" />;
    if (filename.endsWith('.css')) return <FileType size={14} className="text-blue-400" />;
    if (filename.endsWith('.js')) return <FileCode2 size={14} className="text-yellow-400" />;
    return <FileJson size={14} className="text-gray-400" />;
  };

  const handleFolderUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFileSystem: Record<string, string> = {};
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await file.text();
      newFileSystem[file.name] = content;
    }
    setFileSystem(newFileSystem);
    setFolderName(files[0]?.webkitRelativePath.split('/')[0] || 'PROJEM');
  };

  const handleFileContextMenu = (e: React.MouseEvent, file: string) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, type: 'file', target: file });
    setSettingsMenuOpen(false);
  };

  const handleFolderContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, type: 'folder', target: folderName || 'PROJEM' });
    setSettingsMenuOpen(false);
  };

  const closeAllMenus = () => {
    setContextMenu(null);
    setSettingsMenuOpen(false);
  };

  const handleDeleteFile = (file: string) => {
    const newFS = { ...fileSystem };
    delete newFS[file];
    setFileSystem(newFS);
    
    const newOpenFiles = openFiles.filter(f => f !== file);
    setOpenFiles(newOpenFiles);
    if (activeFile === file) {
      setActiveFile(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
    closeAllMenus();
  };

  const handleDeleteFolder = () => {
    if (confirm('Tüm klasörü ve içindeki dosyaları silmek istediğine emin misin?')) {
      setFileSystem({});
      setFolderName(null);
      setActiveFile(null);
      setOpenFiles([]);
      closeAllMenus();
    }
  };

  const startRename = (file: string) => {
    setRenamingFile(file);
    setRenameInput(file);
    closeAllMenus();
  };

  const handleRenameSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (renameInput && renameInput !== renamingFile && !fileSystem[renameInput]) {
        const newFS = { ...fileSystem };
        newFS[renameInput] = newFS[renamingFile!];
        delete newFS[renamingFile!];
        setFileSystem(newFS);
        
        setOpenFiles(prev => prev.map(f => f === renamingFile ? renameInput : f));
        if (activeFile === renamingFile) setActiveFile(renameInput);
        setRenamingFile(null);
      } else if (fileSystem[renameInput] && renameInput !== renamingFile) {
        alert('Bu isimde bir dosya zaten var!');
      } else {
        setRenamingFile(null);
      }
    } else if (e.key === 'Escape') {
      setRenamingFile(null);
    }
  };

  const handleCreateFile = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (newFileName && !fileSystem[newFileName]) {
        setFileSystem(prev => ({ ...prev, [newFileName]: '' }));
        setOpenFiles(prev => [...prev, newFileName]);
        setActiveFile(newFileName);
        setIsCreatingFile(false);
        setNewFileName('');
        if (!folderName) setFolderName('PROJEM'); // Eğer klasör yoksa varsayılan bir isim ata
      } else if (fileSystem[newFileName]) {
        alert('Bu isimde bir dosya zaten var!');
      }
    } else if (e.key === 'Escape') {
      setIsCreatingFile(false);
      setNewFileName('');
    }
  };

  const handleFileClick = (file: string) => {
    if (!openFiles.includes(file)) {
      setOpenFiles(prev => [...prev, file]);
    }
    setActiveFile(file);
  };

  const closeTab = (e: React.MouseEvent, file: string) => {
    e.stopPropagation();
    const newOpenFiles = openFiles.filter(f => f !== file);
    setOpenFiles(newOpenFiles);
    if (activeFile === file) {
      setActiveFile(newOpenFiles.length > 0 ? newOpenFiles[newOpenFiles.length - 1] : null);
    }
  };

  const handleDownloadProject = async () => {
    if (Object.keys(fileSystem).length === 0) {
      alert('İndirilecek dosya yok!');
      return;
    }
    const zip = new JSZip();
    Object.entries(fileSystem).forEach(([path, content]) => {
      zip.file(path, content);
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `${folderName || 'PROJEM'}.zip`);
  };

  const handleRun = () => {
    const htmlFiles = Object.keys(fileSystem).filter(file => file.endsWith('.html'));
    
    if (htmlFiles.length === 0) {
      alert('Projeyi çalıştırmak için en az bir .html dosyasına ihtiyacın var!');
      return;
    }

    let targetHtml = htmlFiles[0];
    if (htmlFiles.length > 0) {
      const userInput = prompt('Hangi HTML dosyasını çalıştırmak istiyorsun?\nMevcut dosyalar:\n' + htmlFiles.join('\n'), htmlFiles[0]);
      if (!userInput) return; // İptal edildi
      
      if (!fileSystem[userInput] || !userInput.endsWith('.html')) {
        alert('Geçerli bir HTML dosyası girmediniz!');
        return;
      }
      targetHtml = userInput;
    }

    let htmlContent = fileSystem[targetHtml];
    const cssContent = Object.keys(fileSystem).filter(f => f.endsWith('.css')).map(f => fileSystem[f]).join('\n');
    const jsContent = Object.keys(fileSystem).filter(f => f.endsWith('.js')).map(f => fileSystem[f]).join('\n');

    if (cssContent) {
      if (htmlContent.includes('</head>')) {
        htmlContent = htmlContent.replace('</head>', `<style>${cssContent}</style></head>`);
      } else {
        htmlContent += `<style>${cssContent}</style>`;
      }
    }

    if (jsContent) {
      if (htmlContent.includes('</body>')) {
        htmlContent = htmlContent.replace('</body>', `<script>${jsContent}</script></body>`);
      } else {
        htmlContent += `<script>${jsContent}</script>`;
      }
    }

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleMenuClick = (item: string) => {
    if (item === 'Çalıştır') {
      handleRun();
    } else if (item === 'Terminal') {
      setIsTerminalOpen(prev => !prev);
    }
  };

  if (!isLoaded) return null;

  return (
    <div 
      className={`h-screen flex flex-col bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden relative ${isDraggingSidebar || isDraggingTerminal ? 'select-none' : ''}`} 
      onClick={closeAllMenus}
    >
      {/* @ts-ignore */}
      <input type="file" ref={folderInputRef} className="hidden" onChange={handleFolderUpload} webkitdirectory="true" directory="true" />
      
      {/* Başlık Çubuğu */}
      <div className="h-8 bg-[#3c3c3c] flex items-center px-4 text-xs select-none">
        <span className="mr-4 cursor-pointer hover:text-white" onClick={() => folderInputRef.current?.click()}>Dosya</span>
        {['Düzen', 'Seçim', 'Görünüm', 'Git', 'Çalıştır', 'Terminal'].map(item => (
          <span key={item} className="mr-4 cursor-pointer hover:text-white" onClick={() => handleMenuClick(item)}>{item}</span>
        ))}
        <span className="flex-grow text-center">{activeFile ? `${activeFile} - ` : ''}{folderName || 'SaaSFlow'} - Ergili İde</span>
      </div>

      {/* Ana İçerik */}
      <div className="flex flex-grow overflow-hidden">
        {/* Etkinlik Çubuğu */}
        <div className="w-12 bg-[#333333] flex flex-col items-center py-4 gap-4 relative">
          <button title="Gezgin" onClick={() => setActiveSidebar('explorer')}>
            <Files className={`cursor-pointer ${activeSidebar === 'explorer' ? 'text-white' : 'text-[#858585] hover:text-white'}`} />
          </button>
          <button title="Ara" onClick={() => setActiveSidebar('search')}>
            <Search className={`cursor-pointer ${activeSidebar === 'search' ? 'text-white' : 'text-[#858585] hover:text-white'}`} />
          </button>
          <button title="Kaynak Denetimi">
            <GitBranch className="cursor-pointer text-[#858585] hover:text-white" />
          </button>
          <button title="Projeyi Çalıştır" onClick={handleRun}>
            <Play className="cursor-pointer text-green-500 hover:text-green-400" />
          </button>
          <button title="Eklentiler">
            <Blocks className="cursor-pointer text-[#858585] hover:text-white" />
          </button>
          
          <div className="flex-grow" />
          
          <button title="Hesap (Ergili PRO)">
            <User className="cursor-pointer text-[#858585] hover:text-white" />
          </button>
          <button title="Bildirimler">
            <Bell className="cursor-pointer text-[#858585] hover:text-white" />
          </button>
          <div className="relative w-full flex justify-center mt-2">
            <Settings 
              className={`cursor-pointer hover:text-white ${settingsMenuOpen ? 'text-white' : ''}`} 
              onClick={(e) => {
                e.stopPropagation();
                setSettingsMenuOpen(!settingsMenuOpen);
                setContextMenu(null);
              }} 
            />
            {/* Ayarlar Menüsü */}
            {settingsMenuOpen && (
              <div 
                className="absolute bottom-0 left-10 bg-[#252526] border border-[#454545] shadow-lg py-1 z-50 text-xs text-[#cccccc] min-w-[220px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-2 hover:bg-[#04395e] hover:text-white cursor-pointer flex justify-between" onClick={() => setEditorTheme(prev => prev === 'vs-dark' ? 'light' : 'vs-dark')}>
                  <span>Tema Değiştir</span>
                  <span className="text-[#858585]">{editorTheme === 'vs-dark' ? 'Koyu' : 'Açık'}</span>
                </div>
                <div className="px-4 py-2 hover:bg-[#04395e] hover:text-white cursor-pointer flex justify-between" onClick={() => setEditorFontSize(prev => prev + 1)}>
                  <span>Yakınlaştır (Zoom In)</span>
                  <span className="text-[#858585]">A+</span>
                </div>
                <div className="px-4 py-2 hover:bg-[#04395e] hover:text-white cursor-pointer flex justify-between" onClick={() => setEditorFontSize(prev => Math.max(8, prev - 1))}>
                  <span>Uzaklaştır (Zoom Out)</span>
                  <span className="text-[#858585]">A-</span>
                </div>
                <div className="h-px bg-[#454545] my-1"></div>
                <div className="px-4 py-2 hover:bg-[#04395e] hover:text-white cursor-pointer flex justify-between" onClick={() => setWordWrap(prev => prev === 'on' ? 'off' : 'on')}>
                  <span>Sözcük Kaydırma</span>
                  <span className="text-[#858585]">{wordWrap === 'on' ? 'Açık' : 'Kapalı'}</span>
                </div>
                <div className="px-4 py-2 hover:bg-[#04395e] hover:text-white cursor-pointer flex justify-between" onClick={() => setMinimapEnabled(prev => !prev)}>
                  <span>Mini Harita</span>
                  <span className="text-[#858585]">{minimapEnabled ? 'Açık' : 'Kapalı'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kenar Çubuğu */}
        <div 
          className="bg-[#252526] flex flex-col"
          style={{ width: sidebarWidth }}
        >
          <div className="p-4 text-xs overflow-y-auto flex-grow">
            {activeSidebar === 'explorer' ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="font-bold uppercase">Gezgin</div>
                <div className="flex gap-2">
                  <button title="Yeni Dosya" onClick={() => setIsCreatingFile(true)}>
                    <FilePlus size={16} className="cursor-pointer hover:text-white" />
                  </button>
                  <button title="Klasör Aç" onClick={() => folderInputRef.current?.click()}>
                    <FolderOpen size={16} className="cursor-pointer hover:text-white" />
                  </button>
                  <button title="Projeyi İndir (ZIP)" onClick={handleDownloadProject}>
                    <Download size={16} className="cursor-pointer hover:text-white" />
                  </button>
                </div>
              </div>
              
              <div 
                className="flex items-center gap-2 mb-2 text-white cursor-pointer"
                onContextMenu={handleFolderContextMenu}
              >
                <ChevronDown size={14} />
                <span>{folderName || 'PROJEM'}</span>
              </div>
              <div className="pl-4 space-y-1">
                {Object.keys(fileSystem).map(file => (
                  <div key={file}>
                    {renamingFile === file ? (
                      <div className="flex items-center gap-2 pl-4 py-0.5">
                        {getFileIcon(file)}
                        <input 
                          autoFocus
                          className="w-full bg-[#3c3c3c] text-white outline-none px-1 py-0.5 border border-blue-500 text-xs"
                          value={renameInput}
                          onChange={(e) => setRenameInput(e.target.value)}
                          onKeyDown={handleRenameSubmit}
                          onBlur={() => setRenamingFile(null)}
                        />
                      </div>
                    ) : (
                      <div 
                        className={`flex items-center gap-2 pl-4 py-0.5 cursor-pointer ${activeFile === file ? 'text-blue-400 bg-[#37373d]' : 'hover:bg-[#2a2d2e] hover:text-white'}`}
                        onClick={() => handleFileClick(file)}
                        onContextMenu={(e) => handleFileContextMenu(e, file)}
                      >
                        {getFileIcon(file)}
                        {file}
                      </div>
                    )}
                  </div>
                ))}
                {isCreatingFile && (
                  <div className="pl-4">
                    <input 
                      autoFocus
                      className="w-full bg-[#3c3c3c] text-white outline-none px-1 py-0.5 border border-blue-500"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      onKeyDown={handleCreateFile}
                      onBlur={() => {
                        if (!newFileName) {
                          setIsCreatingFile(false);
                        }
                      }}
                      placeholder="Dosya adı..."
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="font-bold uppercase mb-4">Ara</div>
              <input 
                type="text" 
                className="w-full bg-[#3c3c3c] text-white outline-none px-2 py-1.5 mb-4 border border-transparent focus:border-blue-500"
                placeholder="Dosyalarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="space-y-2">
                {searchQuery && Object.entries(fileSystem).filter(([name, content]) => content.toLowerCase().includes(searchQuery.toLowerCase()) || name.toLowerCase().includes(searchQuery.toLowerCase())).map(([file, content]) => (
                  <div key={file} className="cursor-pointer hover:bg-[#2a2d2e] p-1" onClick={() => handleFileClick(file)}>
                    <div className="flex items-center gap-2 text-white mb-1">
                      {getFileIcon(file)}
                      <span className="font-bold">{file}</span>
                    </div>
                    <div className="text-[#858585] truncate pl-6">
                      {content.split('\n').find(line => line.toLowerCase().includes(searchQuery.toLowerCase()))?.trim() || 'Eşleşme bulundu'}
                    </div>
                  </div>
                ))}
                {searchQuery && Object.entries(fileSystem).filter(([name, content]) => content.toLowerCase().includes(searchQuery.toLowerCase()) || name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                  <div className="text-[#858585] p-1">Sonuç bulunamadı.</div>
                )}
              </div>
            </>
          )}
          </div>
        </div>

        {/* Sidebar Resize Handle */}
        <div 
          className="w-1 bg-transparent hover:bg-blue-500 cursor-col-resize z-10"
          onMouseDown={() => setIsDraggingSidebar(true)}
        />

        {/* Düzenleyici Alanı */}
        <div className="flex-grow flex flex-col bg-[#1e1e1e] overflow-hidden">
          {openFiles.length > 0 ? (
            <>
              <div className="h-9 bg-[#252526] flex items-center overflow-x-auto no-scrollbar shrink-0">
                {openFiles.map(file => (
                  <div 
                    key={file}
                    className={`h-full px-4 flex items-center gap-2 border-r border-[#1e1e1e] cursor-pointer min-w-fit group ${activeFile === file ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500' : 'bg-[#2d2d2d] text-[#858585] hover:bg-[#2d2d2d] border-t-2 border-t-transparent'}`}
                    onClick={() => setActiveFile(file)}
                  >
                    {getFileIcon(file)}
                    {file} 
                    <X size={14} className={`cursor-pointer rounded hover:bg-[#3c3c3c] ${activeFile === file ? 'text-white' : 'text-transparent group-hover:text-[#858585]'}`} onClick={(e) => closeTab(e, file)} />
                  </div>
                ))}
              </div>
              <div className="flex-grow overflow-hidden">
                {activeFile && (
                  <Editor
                    height="100%"
                    theme={editorTheme}
                    path={activeFile}
                    language={getLanguage(activeFile)}
                    value={fileSystem[activeFile]}
                    onChange={(value) => setFileSystem(prev => ({ ...prev, [activeFile]: value || '' }))}
                    options={{
                      minimap: { enabled: minimapEnabled },
                      fontSize: editorFontSize,
                      wordWrap: wordWrap,
                      formatOnPaste: true,
                      formatOnType: true,
                      automaticLayout: true,
                      tabSize: 2,
                    }}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex-grow flex flex-col bg-[#1e1e1e] overflow-y-auto text-[#cccccc] p-8 md:p-16">
              <div className="max-w-4xl w-full mx-auto">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-light text-white">Ergili İde</h1>
                  <span className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                    <Crown size={12} /> PRO
                  </span>
                </div>
                <p className="text-[#858585] mb-12 text-lg">SaaSFlow altyapısıyla güçlendirilmiş, bulut tabanlı modern web geliştirme ortamınız.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Başlangıç */}
                  <div>
                    <h2 className="text-xl font-normal text-white mb-4 flex items-center gap-2">
                      <Zap size={20} className="text-yellow-400"/> Başlangıç
                    </h2>
                    <div className="space-y-2">
                      <button className="w-full flex items-center gap-4 p-3 hover:bg-[#2a2d2e] rounded-lg text-left transition-colors border border-transparent hover:border-[#454545]" onClick={() => setIsCreatingFile(true)}>
                        <div className="bg-[#007acc] bg-opacity-20 p-2 rounded text-[#007acc]">
                          <FilePlus size={20} />
                        </div>
                        <div>
                          <div className="text-white font-medium">Yeni Dosya</div>
                          <div className="text-xs text-[#858585]">Boş bir dosya oluşturun ve kodlamaya başlayın</div>
                        </div>
                      </button>
                      <button className="w-full flex items-center gap-4 p-3 hover:bg-[#2a2d2e] rounded-lg text-left transition-colors border border-transparent hover:border-[#454545]" onClick={() => folderInputRef.current?.click()}>
                        <div className="bg-blue-500 bg-opacity-20 p-2 rounded text-blue-400">
                          <FolderOpen size={20} />
                        </div>
                        <div>
                          <div className="text-white font-medium">Klasör Aç</div>
                          <div className="text-xs text-[#858585]">Yerel bilgisayarınızdan bir projeyi içe aktarın</div>
                        </div>
                      </button>
                      <button className="w-full flex items-center gap-4 p-3 hover:bg-[#2a2d2e] rounded-lg text-left transition-colors border border-transparent hover:border-[#454545]" onClick={handleRun}>
                        <div className="bg-green-500 bg-opacity-20 p-2 rounded text-green-500">
                          <Play size={20} />
                        </div>
                        <div>
                          <div className="text-white font-medium">Projeyi Çalıştır</div>
                          <div className="text-xs text-[#858585]">HTML/CSS/JS kodlarınızı canlı olarak test edin</div>
                        </div>
                      </button>
                      <button className="w-full flex items-center gap-4 p-3 hover:bg-[#2a2d2e] rounded-lg text-left transition-colors border border-transparent hover:border-[#454545]" onClick={handleDownloadProject}>
                        <div className="bg-purple-500 bg-opacity-20 p-2 rounded text-purple-400">
                          <Download size={20} />
                        </div>
                        <div>
                          <div className="text-white font-medium">Projeyi İndir</div>
                          <div className="text-xs text-[#858585]">Tüm dosyalarınızı ZIP formatında bilgisayarınıza kaydedin</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* İpuçları ve Kısayollar */}
                  <div>
                    <h2 className="text-xl font-normal text-white mb-4 flex items-center gap-2">
                      <Keyboard size={20} className="text-gray-400"/> İpuçları ve Özellikler
                    </h2>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-3 bg-[#252526] rounded-lg border border-[#333]">
                        <Terminal size={20} className="text-[#858585] mt-0.5" />
                        <div>
                          <div className="text-white font-medium mb-1">Dahili Terminal</div>
                          <div className="text-xs text-[#858585] leading-relaxed">Üst menüden "Terminal"e tıklayarak veya komut satırını kullanarak projelerinizi yönetin. (Örn: <code className="bg-[#1e1e1e] px-1 rounded">help</code>, <code className="bg-[#1e1e1e] px-1 rounded">run</code>)</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-3 bg-[#252526] rounded-lg border border-[#333]">
                        <Search size={20} className="text-[#858585] mt-0.5" />
                        <div>
                          <div className="text-white font-medium mb-1">Global Arama</div>
                          <div className="text-xs text-[#858585] leading-relaxed">Sol menüdeki büyüteç ikonuna tıklayarak tüm dosyalarınızın içinde anında metin araması yapın.</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-3 bg-[#252526] rounded-lg border border-[#333]">
                        <BookOpen size={20} className="text-[#858585] mt-0.5" />
                        <div>
                          <div className="text-white font-medium mb-1">Bulut Senkronizasyonu</div>
                          <div className="text-xs text-[#858585] leading-relaxed">Yazdığınız her kod, açtığınız sekmeler ve ayarlarınız tarayıcınıza otomatik kaydedilir. Veri kaybı yaşamazsınız.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Terminal Alanı */}
          {isTerminalOpen && (
            <div className="flex flex-col border-t border-[#454545] bg-[#1e1e1e]" style={{ height: terminalHeight }}>
              {/* Terminal Resize Handle */}
              <div 
                className="h-1 w-full bg-transparent hover:bg-blue-500 cursor-row-resize absolute -mt-1"
                onMouseDown={() => setIsDraggingTerminal(true)}
              />
              
              {/* Terminal Başlık */}
              <div className="flex justify-between items-center px-4 py-1 border-b border-[#454545] text-xs uppercase tracking-wider">
                <div className="flex gap-4">
                  <span className="text-white border-b border-blue-500 pb-1">Terminal</span>
                  <span className="text-[#858585] hover:text-white cursor-pointer">Çıktı</span>
                  <span className="text-[#858585] hover:text-white cursor-pointer">Hata Ayıklama Konsolu</span>
                </div>
                <div className="flex gap-2">
                  <button title="Terminali Büyüt/Küçült" onClick={() => setTerminalHeight(prev => prev > 300 ? 200 : 400)}>
                    {terminalHeight > 300 ? <Minimize2 size={14} className="cursor-pointer hover:text-white" /> : <Maximize2 size={14} className="cursor-pointer hover:text-white" />}
                  </button>
                  <button title="Terminali Kapat" onClick={() => setIsTerminalOpen(false)}>
                    <X size={14} className="cursor-pointer hover:text-white" />
                  </button>
                </div>
              </div>

              {/* Terminal İçerik */}
              <div className="flex-grow p-4 font-mono text-sm overflow-y-auto">
                {terminalHistory.map((item, index) => (
                  <div key={index} className="mb-1 whitespace-pre-wrap">
                    {item.type === 'input' && <span className="text-blue-400">{item.text}</span>}
                    {item.type === 'output' && <span className="text-gray-300">{item.text}</span>}
                    {item.type === 'error' && <span className="text-red-400">{item.text}</span>}
                  </div>
                ))}
                <div className="flex items-center">
                  <span className="text-blue-400 mr-2">C:\Users\Ergili\Projem&gt;</span>
                  <input
                    type="text"
                    className="flex-grow bg-transparent outline-none text-gray-300"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={handleTerminalCommand}
                    autoFocus
                    spellCheck={false}
                  />
                </div>
                <div ref={terminalEndRef} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Durum Çubuğu */}
      <div className="h-6 bg-[#007acc] flex items-center px-4 text-xs text-white justify-between">
        <div className="flex gap-4">
          <span>main*</span>
          <span>0 hata, 0 uyarı</span>
        </div>
        <div className="flex gap-4">
          <span>{activeFile ? 'Ln 1, Col 1' : ''}</span>
          <span>UTF-8</span>
          <span>{activeFile ? activeFile.split('.').pop()?.toUpperCase() : ''}</span>
        </div>
      </div>

      {/* Sağ Tık Menüsü */}
      {contextMenu && (
        <div 
          className="fixed bg-[#252526] border border-[#454545] shadow-lg py-1 z-50 text-xs text-[#cccccc] min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.type === 'file' ? (
            <>
              <div className="px-4 py-1.5 hover:bg-[#04395e] hover:text-white cursor-pointer" onClick={() => startRename(contextMenu.target)}>Yeniden Adlandır</div>
              <div className="px-4 py-1.5 hover:bg-[#04395e] hover:text-white cursor-pointer" onClick={() => handleDeleteFile(contextMenu.target)}>Sil</div>
            </>
          ) : (
            <div className="px-4 py-1.5 hover:bg-[#04395e] hover:text-white cursor-pointer text-red-400" onClick={handleDeleteFolder}>Klasörü Kaldır</div>
          )}
          <div className="h-px bg-[#454545] my-1"></div>
          <div className="px-4 py-1.5 text-[#858585] cursor-default italic">SEMİH AHMET ERGİLİ</div>
        </div>
      )}
    </div>
  );
}
