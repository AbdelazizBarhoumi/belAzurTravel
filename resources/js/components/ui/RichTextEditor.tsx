import ReactQuill from 'react-quill';

interface Props {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const modules = {
    toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['blockquote', 'code-block'],
        ['link'],
        ['clean'],
    ],
};

const formats = [
    'header',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'align',
    'blockquote',
    'code-block',
    'link',
];

export function RichTextEditor({ value, onChange, placeholder }: Props) {
    return (
        <ReactQuill
            theme="snow"
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            modules={modules}
            formats={formats}
        />
    );
}
