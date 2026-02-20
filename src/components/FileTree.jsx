import { useState, useCallback } from 'react';
import { useDrag } from 'react-dnd';

export const SOURCE_FILE_TYPE = 'SOURCE_FILE';

/**
 * FileTree - Recursive tree view component for browsing filesystem
 * Supports expand/collapse folders and dragging files into chat for AI context
 */

function FileTreeItem({ item, level = 0, selectedFiles, onExpand, expandedPaths }) {
  const isExpanded = expandedPaths.has(item.path);
  const isSelected = selectedFiles.has(item.path);
  const [children, setChildren] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [{ isDragging }, drag] = useDrag({
    type: SOURCE_FILE_TYPE,
    item: { path: item.path, name: item.name, isDirectory: item.isDirectory },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const handleExpand = async () => {
    if (!item.isDirectory) return;

    if (isExpanded) {
      onExpand(item.path, false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await window.api.listDirectory(item.path);
      if (result.error) {
        setError(result.error);
      } else {
        setChildren(result);
      }
      onExpand(item.path, true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const indent = level * 12;

  return (
    <div className="file-tree-item-container">
      <div
        ref={drag}
        className={`file-tree-item ${item.isDirectory ? 'folder' : 'file'} ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{ paddingLeft: `${indent + 8}px`, opacity: isDragging ? 0.4 : 1 }}
        onClick={item.isDirectory ? handleExpand : undefined}
      >
        {item.isDirectory && (
          <span className="folder-toggle">
            {isLoading ? '...' : isExpanded ? '▼' : '▶'}
          </span>
        )}

        <span className="file-icon">
          {item.isDirectory ? '📁' : getFileIcon(item.name)}
        </span>

        <span className="file-name" title={item.path}>
          {item.name}
        </span>
      </div>

      {error && (
        <div className="file-tree-error" style={{ paddingLeft: `${indent + 24}px` }}>
          {error}
        </div>
      )}

      {isExpanded && children.length > 0 && (
        <div className="file-tree-children">
          {children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              level={level + 1}
              selectedFiles={selectedFiles}
              onExpand={onExpand}
              expandedPaths={expandedPaths}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Get appropriate icon for file type
 */
function getFileIcon(fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase();

  const iconMap = {
    // Code files
    js: '📜', jsx: '📜', ts: '📜', tsx: '📜',
    py: '🐍', rb: '💎', go: '🔷', rs: '🦀',
    java: '☕', cpp: '⚙️', c: '⚙️', h: '⚙️',

    // Web files
    html: '🌐', css: '🎨', scss: '🎨', less: '🎨',

    // Data files
    json: '📋', xml: '📋', yaml: '📋', yml: '📋',
    csv: '📊', sql: '🗃️',

    // Documents
    md: '📝', txt: '📄', pdf: '📕', doc: '📘', docx: '📘',

    // Images
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', svg: '🖼️',

    // Config
    env: '🔐', gitignore: '🚫', dockerfile: '🐳',

    // Archives
    zip: '📦', tar: '📦', gz: '📦'
  };

  return iconMap[ext] || '📄';
}

/**
 * Main FileTree component
 */
function FileTree({ rootItems, selectedFiles }) {
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  const handleExpand = useCallback((path, expand) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (expand) {
        next.add(path);
      } else {
        next.delete(path);
      }
      return next;
    });
  }, []);

  if (!rootItems || rootItems.length === 0) {
    return (
      <div className="file-tree-empty">
        No items to display
      </div>
    );
  }

  return (
    <div className="file-tree">
      {rootItems.map((item) => (
        <FileTreeItem
          key={item.path}
          item={item}
          level={0}
          selectedFiles={selectedFiles}
          onExpand={handleExpand}
          expandedPaths={expandedPaths}
        />
      ))}
    </div>
  );
}

export default FileTree;
