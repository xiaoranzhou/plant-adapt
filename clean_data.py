#!/usr/bin/env python3
"""
Script to clean and optimize GWAS data for Manhattan plot
"""
import sys
import json

def clean_gwas_data(input_file, output_file):
    """Clean and optimize GWAS data"""
    
    with open(input_file, 'r') as f:
        content = f.read()
    
    # The file seems to have literal \n instead of actual newlines
    if '\\n' in content:
        lines = content.strip().split('\\n')
    else:
        lines = content.strip().split('\n')
    
    header_line = lines[0]
    
    # Extract header - handle both literal \t and actual tabs
    if '\\t' in header_line:
        header = header_line.split('\\t')
    else:
        header = header_line.split('\t')
    print(f"Header: {header}")
    
    # Find relevant column indices
    chrom_idx = header.index('#CHROM')
    pos_idx = header.index('POS')
    p_idx = header.index('P')
    
    print(f"CHROM index: {chrom_idx}, POS index: {pos_idx}, P index: {p_idx}")
    
    # Process data lines
    cleaned_data = []
    for i, line in enumerate(lines[1:], 1):
        if i % 100000 == 0:
            print(f"Processed {i} lines")
        
        # Handle both literal \t and actual tab characters
        if '\\t' in line:
            parts = line.split('\\t')
        else:
            parts = line.split('\t')
        if len(parts) <= max(chrom_idx, pos_idx, p_idx):
            continue
            
        chrom = parts[chrom_idx].replace("'", "").replace('"', '')
        pos = parts[pos_idx]
        p_val = parts[p_idx]
        
        # Skip if we can't parse chromosome or p-value
        try:
            chrom_num = int(chrom)
            p_float = float(p_val)
            pos_int = int(pos)
            
            # Only keep valid p-values
            if p_float > 0 and p_float <= 1:
                cleaned_data.append([chrom_num, pos_int, p_float])
        except (ValueError, TypeError):
            continue
    
    print(f"Cleaned data has {len(cleaned_data)} rows")
    
    # Write as JSON for easy loading
    with open(output_file, 'w') as f:
        json.dump({
            'header': ['CHR', 'POS', 'P'],
            'data': cleaned_data
        }, f, separators=(',', ':'))
    
    # Also write first 1000 rows for testing
    test_data = cleaned_data[:1000]
    with open(output_file.replace('.json', '_test.json'), 'w') as f:
        json.dump({
            'header': ['CHR', 'POS', 'P'],
            'data': test_data
        }, f, separators=(',', ':'))
    
    print(f"Written {len(cleaned_data)} rows to {output_file}")
    print(f"Written {len(test_data)} test rows to {output_file.replace('.json', '_test.json')}")

if __name__ == "__main__":
    clean_gwas_data('public/linear.txt', 'public/gwas_data.json')