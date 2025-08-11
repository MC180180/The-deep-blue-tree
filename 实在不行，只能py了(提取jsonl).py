import tkinter as tk
from tkinter import filedialog, messagebox
import json
import os

class JSONLTextExtractor:
    def __init__(self, root):
        self.root = root
        self.root.title("JSONL文本提取器")
        self.root.geometry("600x400")
        
        # 创建界面元素
        self.create_widgets()
        
    def create_widgets(self):
        # 文件选择框
        self.file_frame = tk.LabelFrame(self.root, text="文件选择", padx=5, pady=5)
        self.file_frame.pack(padx=10, pady=5, fill="x")
        
        self.file_path = tk.StringVar()
        self.file_entry = tk.Entry(self.file_frame, textvariable=self.file_path, width=50)
        self.file_entry.pack(side="left", padx=5)
        
        self.browse_btn = tk.Button(self.file_frame, text="浏览", command=self.browse_file)
        self.browse_btn.pack(side="left", padx=5)
        
        # 保存位置框
        self.save_frame = tk.LabelFrame(self.root, text="保存位置", padx=5, pady=5)
        self.save_frame.pack(padx=10, pady=5, fill="x")
        
        self.save_path = tk.StringVar()
        self.save_entry = tk.Entry(self.save_frame, textvariable=self.save_path, width=50)
        self.save_entry.pack(side="left", padx=5)
        
        self.save_btn = tk.Button(self.save_frame, text="选择", command=self.browse_save)
        self.save_btn.pack(side="left", padx=5)
        
        # 提取按钮
        self.extract_btn = tk.Button(self.root, text="提取文本", command=self.extract_text)
        self.extract_btn.pack(pady=20)
        
        # 状态栏
        self.status = tk.Label(self.root, text="准备就绪", bd=1, relief=tk.SUNKEN, anchor=tk.W)
        self.status.pack(side=tk.BOTTOM, fill=tk.X)
        
    def browse_file(self):
        filename = filedialog.askopenfilename(
            filetypes=[("JSONL files", "*.jsonl"), ("All files", "*.*")]
        )
        if filename:
            self.file_path.set(filename)
            
    def browse_save(self):
        filename = filedialog.asksaveasfilename(
            defaultextension=".txt",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if filename:
            self.save_path.set(filename)
            
    def extract_text(self):
        input_file = self.file_path.get()
        output_file = self.save_path.get()
        
        if not input_file or not output_file:
            messagebox.showerror("错误", "请选择输入文件和保存位置")
            return
            
        try:
            with open(input_file, 'r', encoding='utf-8') as f_in, \
                 open(output_file, 'w', encoding='utf-8') as f_out:
                
                for line in f_in:
                    try:
                        data = json.loads(line)
                        # 提取所有字符串值
                        text_parts = []
                        for value in data.values():
                            if isinstance(value, str):
                                text_parts.append(value)
                        if text_parts:
                            f_out.write('\n'.join(text_parts) + '\n')
                    except json.JSONDecodeError:
                        continue
                        
            self.status.config(text="文本提取完成！")
            messagebox.showinfo("成功", "文本提取完成！")
            
        except Exception as e:
            self.status.config(text=f"错误: {str(e)}")
            messagebox.showerror("错误", str(e))

if __name__ == "__main__":
    root = tk.Tk()
    app = JSONLTextExtractor(root)
    root.mainloop()
＃Asuka天下第一
