with open('src/components/AdminDashboard.jsx', 'r', encoding='utf-8') as f:
    content = f.read()
    print(f'CBRACE_OPEN: {content.count("{")}')
    print(f'CBRACE_CLOSE: {content.count("}")}')
    print(f'PAREN_OPEN: {content.count("(")}')
    print(f'PAREN_CLOSE: {content.count(")")}')
    print(f'TAG_OPEN: {content.count("<")}')
    print(f'TAG_CLOSE: {content.count(">")}')
