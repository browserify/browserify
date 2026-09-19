declare var React: any;
declare var ex: (el: any) => void;

interface Props { name: string }

function Hello (props: Props) {
    return <div className="hello">{props.name}</div>;
}

ex(<Hello name="boop" />);
